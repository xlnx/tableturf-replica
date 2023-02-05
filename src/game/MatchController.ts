import { Game, Move } from "boardgame.io";
import { ActivePlayers, INVALID_MOVE } from "boardgame.io/core";
import {
  initGame,
  isDeckValid,
  isGameMoveValid,
  moveGame,
} from "../core/Tableturf";

const N = 4;

export interface TableturfPlayerInfo {
  name: string;
  deck: number[];
}

export const StarterDeck = [
  6, 13, 22, 28, 40, 34, 45, 52, 55, 56, 159, 137, 141, 103, 92,
];

const UpdateState: Move<IMatchState> = {
  move: ({ G, playerID }, newState: Partial<IMatchState>) => {
    // only daemon can update state
    if (+playerID != 0) {
      return INVALID_MOVE;
    }
    Object.assign(G, newState);
  },
  client: false,
  ignoreStaleStateID: true,
};

// daemon only
const HandleRoundTle: Move<IMatchState> = {
  move: ({ G, playerID }, round: number) => {
    if (+playerID != 0) {
      return INVALID_MOVE;
    }
    if (G.game.round != round) {
      // expired
      return INVALID_MOVE;
    }
    G.buffer.tle = true;
  },
  client: false,
  ignoreStaleStateID: true,
};

const PlayerMove: Move<IMatchState> = {
  move: ({ G, playerID }, move_: Omit<IPlayerMovement, "player">) => {
    const player = G.meta.players.indexOf(playerID);
    if (player == -1) {
      return INVALID_MOVE;
    }
    const move = { ...move_, player: player as IPlayerId };
    if (!isGameMoveValid(G.game, move)) {
      return INVALID_MOVE;
    }
    if (G.buffer.moves[player]) {
      return INVALID_MOVE;
    }
    G.buffer.moves[player] = move;
    G.buffer.redrawQuota[player] = 0;
  },
  client: false,
  ignoreStaleStateID: true,
};

const Redraw: Move<IMatchState> = {
  move: ({ G, playerID, random }) => {
    const player = G.meta.players.indexOf(playerID);
    if (player == -1) {
      return INVALID_MOVE;
    }
    if (G.game.round != 12) {
      return INVALID_MOVE;
    }
    if (G.buffer.redrawQuota[player] <= 0) {
      return INVALID_MOVE;
    }
    const { players } = G.game;
    let { hand, deck } = players[player];
    deck = random.Shuffle(hand.concat(deck));
    // TODO: support partial redraw
    G.replay.redraws[player].push({
      hands: [0, 1, 2, 3],
      deck: deck.slice(),
    });
    hand = deck.splice(0, 4);
    players[player] = { ...players[player], hand, deck };
    G.buffer.redrawQuota[player] -= 1;
  },
  client: false,
  ignoreStaleStateID: true,
};

const GiveUp: Move<IMatchState> = {
  move: ({ G, playerID }) => {
    const player = G.meta.players.indexOf(playerID);
    if (player == -1) {
      return INVALID_MOVE;
    }
    G.buffer.giveUp[player] = true;
  },
  client: false,
  ignoreStaleStateID: true,
};

const ToggleReady: Move<IMatchState> = {
  move: ({ G, playerID }) => {
    // none-host
    if (G.meta.host != playerID) {
      G.buffer.ready[playerID] = !G.buffer.ready[playerID];
      return;
    }
    // host, player not enough
    if (G.meta.players.length != 2) {
      return INVALID_MOVE;
    }
    // host, some other player isn't ready
    if (!G.meta.players.every((i) => i == playerID || G.buffer.ready[i])) {
      return INVALID_MOVE;
    }
    // host, ready
    G.buffer.ready[playerID] = true;
  },
  client: false,
  ignoreStaleStateID: true,
};

const UpdateMeta: Move<IMatchState> = {
  move: ({ G, playerID }, meta: Partial<IMatchMeta>) => {
    if (playerID != G.meta.host) {
      return INVALID_MOVE;
    }
    Object.assign(G.meta, meta);
  },
  client: false,
  ignoreStaleStateID: true,
};

const UpdateHost: Move<IMatchState> = {
  move: ({ G, playerID }, dstPlayerID: string) => {
    if (playerID != G.meta.host) {
      return INVALID_MOVE;
    }
    if (G.daemon.players.indexOf(dstPlayerID) < 0) {
      return INVALID_MOVE;
    }
    G.meta.host = dstPlayerID;
    G.buffer.ready[dstPlayerID] = false;
  },
  client: false,
  ignoreStaleStateID: true,
};

const Handshake: Move<IMatchState> = {
  move: ({ G, playerID }, { deck }: IHandshake) => {
    const player = G.meta.players.indexOf(playerID);
    if (player < 0) {
      return INVALID_MOVE;
    }
    const decks = G.daemon.decks.slice();
    decks[player] = deck.slice();
    Object.assign(G.daemon, { decks });
  },
  client: false,
  ignoreStaleStateID: true,
};

const ToggleRole: Move<IMatchState> = {
  move: ({ G, playerID }, dstPlayerID) => {
    if (playerID != G.meta.host) {
      return INVALID_MOVE;
    }
    if (G.daemon.players.indexOf(dstPlayerID) < 0) {
      return INVALID_MOVE;
    }
    const idx = G.meta.players.indexOf(dstPlayerID);
    if (idx < 0) {
      if (G.meta.players.length >= 2) {
        return INVALID_MOVE;
      }
      // spectator -> player, give him some time to prepare
      G.meta.players.push(dstPlayerID);
      G.buffer.ready[dstPlayerID] = false;
    } else {
      G.meta.players.splice(idx, 1);
    }
  },
  client: false,
  ignoreStaleStateID: true,
};

export const MatchController: Game<IMatchState> = {
  name: "tableturf",

  maxPlayers: N + 1,

  setup: () => ({
    daemon: {
      players: [],
      decks: [],
    },
    game: null,
    meta: {
      host: "",
      players: [],
      stage: 3,
      redrawQuota: 1,
      turnTimeQuotaSec: 0,
    },
    buffer: {
      ready: [],
      redrawQuota: [],
      timestamp: "",
      tle: false,
      giveUp: [],
      moves: [],
      prevMoves: [],
      cards: [],
    },
  }),

  playerView: ({ G, ctx, playerID }) => {
    if (+playerID == 0) {
      return G;
    }
    G = { ...G };
    delete G.daemon;
    if (ctx.phase != "play") {
      return G;
    }
    delete G.replay;
    const player = G.meta.players.indexOf(playerID);
    if (player == -1) {
      return G;
    }
    // eslint-disable-next-line prefer-const
    let { game, buffer } = G;
    if (game) {
      const players = game.players.map((info, i) =>
        i == player
          ? { ...info, deck: [] }
          : { ...info, deck: [], hand: Array(4).fill(-1) }
      );
      game = { ...game, players };
    }
    return {
      ...G,
      game,
      buffer: {
        ...buffer,
        moves: buffer.moves.map((e) => (e ? {} : null)),
      },
    };
  },

  phases: {
    beforePrepare: {
      start: true,
      endIf: () => true,
      onEnd: ({ G }) => {
        G.buffer.ready = Array(N + 1).fill(false);
      },
      next: "prepare",
    },

    prepare: {
      moves: { UpdateState, UpdateMeta, UpdateHost, ToggleRole, ToggleReady },
      turn: {
        activePlayers: ActivePlayers.ALL,
      },
      endIf: ({ G }) =>
        // 2 players
        G.meta.players.length == 2 &&
        // every player is ready
        G.meta.players.every((i) => G.buffer.ready[i]) &&
        // host is ready
        G.buffer.ready[G.meta.host],
      next: "beforeHandshake",
    },

    beforeHandshake: {
      endIf: () => true,
      onEnd: ({ G }) => {
        G.daemon.decks = Array(2).fill([]);
      },
      next: "handshake",
    },

    handshake: {
      endIf: ({ G }) => G.daemon.decks.every(isDeckValid),
      moves: { UpdateState, Handshake },
      turn: {
        activePlayers: ActivePlayers.ALL,
      },
      next: "beforePlay",
    },

    beforePlay: {
      endIf: () => true,
      onEnd: ({ G, random }) => {
        const decks = G.daemon.decks.map(random.Shuffle);
        G.game = initGame(G.meta.stage, decks.slice());
        G.buffer = {
          ready: Array(N + 1).fill(false),
          redrawQuota: Array(2).fill(G.meta.redrawQuota),
          timestamp: new Date().toISOString(),
          tle: false,
          giveUp: Array(2).fill(false),
          moves: Array(2).fill(null),
          prevMoves: [],
          cards: [],
        };
        G.replay = {
          players: [],
          winner: null,
          finishReason: "normal",
          startTime: new Date().toISOString(),
          finishTime: "",
          stage: G.meta.stage,
          decks,
          redraws: [[], []],
          moves: [],
        };
      },
      next: "play",
    },

    play: {
      moves: { UpdateState, HandleRoundTle, PlayerMove, Redraw, GiveUp },
      turn: {
        activePlayers: ActivePlayers.ALL,
        endIf: ({ G }) => G.buffer.moves.every((e) => e),
        onEnd: ({ G }) => {
          const { moves } = G.buffer;
          if (moves.every((e) => e)) {
            const cards = moves.map(
              ({ hand }, i) => G.game.players[i].hand[hand]
            );
            G.game = moveGame(G.game, moves);
            G.buffer.moves = Array(2).fill(null);
            G.buffer.prevMoves = moves;
            G.buffer.cards.push(cards);
            G.buffer.timestamp = new Date().toISOString();
            G.replay.moves.push(moves);
          }
        },
      },
      endIf: ({ G }) =>
        // game ends
        G.game.round == 0 ||
        // some player left
        G.meta.players.length < 2 ||
        // some player give up
        G.buffer.giveUp.some((e) => e) ||
        // tle
        G.buffer.tle,
      onEnd: ({ G }) => {
        if (G.game.round == 0) {
          const [a, b] = G.game.board.count.area;
          G.replay.winner = a > b ? 0 : b > a ? 1 : null;
          return;
        }
        const [a, b] = G.buffer.giveUp;
        if (G.buffer.tle) {
          const [m1, m2] = G.buffer.moves;
          // someone must not moved
          console.assert(!m1 || !m2);
          G.replay.finishReason = "tle";
          G.replay.winner = !m1 && !m2 ? null : m1 ? 0 : 1;
        } else if (a || b) {
          // only one can give up
          console.assert(!(a && b));
          G.replay.finishReason = "giveup";
          G.replay.winner = a ? 1 : 0;
        } else {
          // some player left
          console.assert(G.meta.players.length < 2);
          G.replay = null;
          return;
        }
      },
      next: "beforePrepare",
    },
  },
};
