import {
  ReplayDef,
  ReplayDefV1,
  decodeReplayDef,
  encodeReplayDef,
} from "./ReplayProto";
import Long from "long";

function toBase64Url(buffer: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, buffer))
    .split("=")[0]
    .replaceAll("+", "-")
    .replaceAll("/", "_");
}

function fromBase64Url(base64url: string): Uint8Array {
  let str = base64url.replaceAll("-", "+").replaceAll("_", "/");
  switch (str.length % 4) {
    case 0:
      break;
    case 2:
      str += "==";
      break;
    case 3:
      str += "=";
      break;
    default:
      throw new Error(`illegal base64url string: [${base64url}]`);
  }
  return new Uint8Array(
    atob(str)
      .split("")
      .map((c) => c.charCodeAt(0))
  );
}

export function encodeReplay(replay: IMatchReplay): string {
  const buffer = encodeReplayDef({ version: 1, v1: encodeReplayV1(replay) });
  return toBase64Url(buffer);
}

function encodeReplayV1({
  players,
  winner,
  finishReason,
  startTime,
  finishTime,
  stage,
  decks,
  redraws,
  moves,
}: IMatchReplay): ReplayDefV1 {
  const [playerAlpha, playerBravo] = players;
  let result = winner == null ? 2 : winner;
  result |= { normal: 0, tle: 1, giveup: 2 }[finishReason] << 2;
  const timestamp = new Date(startTime).getTime();
  const [decksAlpha, decksBravo] = decks;
  const [redrawsAlpha, redrawsBravo] = redraws.map((li) =>
    li.map(({ hands, deck }) => ({
      hands: hands.map((i) => 1 << i).reduce((a, b) => a | b),
      deck,
    }))
  );
  return {
    playerAlpha,
    playerBravo,
    /**
     * {
     *   winner: 2 => { alpha=0, bravo=1, none=2 }
     *   reason: 2+ => { normal=0, tle=1, giveup=2 }
     * }
     **/
    result,
    timestamp: Long.fromNumber(timestamp, true),
    ...(!finishTime
      ? {}
      : { elapsed: new Date(finishTime).getTime() - timestamp }),
    stage,
    decksAlpha,
    decksBravo,
    redrawsAlpha,
    redrawsBravo,
    /**
     * {
     *   action: 2 => { discard=0, trivial=1, special=2 }
     *   hand: 2 => { 0, 1, 2, 3 }
     *   rotation: 2 => { 0, 1, 2, 3 }
     *   x: 5 => {  }
     *   y: 5 => {  }
     * }
     **/
    moves: moves.map((li) => {
      const [a, b] = li.map(({ action, hand, params }) => {
        let v = { discard: 0, trivial: 1, special: 2 }[action];
        v |= hand << 2;
        if (action != "discard") {
          const {
            rotation,
            position: { x, y },
          } = params;
          v |= rotation << 4;
          v |= (x + 4) << 6;
          v |= (y + 4) << 11;
        }
        return v;
      });
      return a | (b << 16);
    }),
  };
}

export function decodeReplay(base64url: string): IMatchReplay {
  let replay: ReplayDef;
  try {
    replay = decodeReplayDef(fromBase64Url(base64url));
  } catch (err) {
    throw new Error(`invalid replay: [${base64url}]`);
  }
  switch (replay.version) {
    case 1:
      return decodeReplayV1(replay.v1);
    default:
      throw new Error(`unknown replay version: ${replay.version}`);
  }
}

function decodeReplayV1({
  playerAlpha,
  playerBravo,
  result,
  timestamp,
  elapsed = 0,
  stage,
  decksAlpha = [],
  decksBravo = [],
  redrawsAlpha = [],
  redrawsBravo = [],
  moves,
}: ReplayDefV1): IMatchReplay {
  let winner = result & 0x3;
  if (winner == 2) {
    winner = null;
  }
  const finishReason = ["normal", "tle", "giveup"][
    (result >> 2) & 0x3
  ] as IMatchFinishReason;
  const ts = new Long(
    timestamp.low,
    timestamp.high,
    timestamp.unsigned
  ).toNumber();
  return {
    players: [playerAlpha, playerBravo],
    winner: winner as IPlayerId,
    finishReason,
    startTime: new Date(ts).toISOString(),
    finishTime: new Date(ts + elapsed).toISOString(),
    stage,
    decks: [decksAlpha, decksBravo],
    redraws: [redrawsAlpha, redrawsBravo].map((li) =>
      li.map(({ hands, deck }) => ({
        hands: !hands
          ? [0, 1, 2, 3]
          : [0, 1, 2, 3].filter((e) => !!(hands & (1 << e))),
        deck,
      }))
    ),
    moves: moves.map((v) =>
      [v & 0xffff, (v >> 16) & 0xffff].map((e, i) => {
        const action = ["discard", "trivial", "special"][e & 0x3] as any;
        const hand = (e >> 2) & 0x3;
        let params;
        if (action != "discard") {
          const rotation = (e >> 4) & 0x3;
          const x = ((e >> 6) & 0x1f) - 4;
          const y = ((e >> 11) & 0x1f) - 4;
          params = {
            rotation,
            position: { x, y },
          };
        }
        return {
          player: i as IPlayerId,
          action,
          hand,
          ...(!params ? {} : { params }),
        };
      })
    ),
  };
}
