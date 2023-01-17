import { Game, Move } from "boardgame.io";
import { ActivePlayers, INVALID_MOVE } from "boardgame.io/core";
import {
  initGame,
  isGameMoveValid,
  moveGame,
} from "tableturf-core/dist/src/Api";
import { IPlayerId, IPlayerMovement } from "tableturf-core/dist/src/Types";
import { IMatchMeta, IMatchState } from "./Types";

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

const ToggleReady: Move<IMatchState> = {
  move: ({ G, playerID }) => {
    G.buffer.ready[playerID] = !G.buffer.ready[playerID];
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
    hand = deck.splice(0, 4);
    players[player] = { ...players[player], hand, deck };
    G.buffer.redrawQuota[player] -= 1;
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

export const MatchController: Game<IMatchState> = {
  name: "tableturf",

  maxPlayers: N + 1,

  setup: () => ({
    daemon: {
      players: [],
    },
    game: null,
    meta: {
      host: "",
      players: [],
      stage: 1,
      redrawQuota: 1,
      timeQuotaSec: null,
    },
    buffer: {
      moves: [],
      ready: [],
      redrawQuota: [],
      history: [],
    },
  }),

  playerView: ({ G, ctx, playerID }) => {
    if (ctx.phase != "play") {
      return G;
    }
    const player = G.meta.players.indexOf(playerID);
    if (player == -1) {
      return G;
    }
    let { game } = G;
    if (game) {
      const players = game.players.map((info, i) =>
        i == player
          ? { ...info, deck: [] }
          : { ...info, deck: [], hand: Array(4).fill(-1) }
      );
      game = { ...game, players };
    }
    return {
      game,
      meta: G.meta,
      buffer: {
        moves: G.buffer.moves.map((e) => (e ? {} : null)),
        history: G.buffer.history.slice(-1),
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
      moves: { UpdateState, UpdateMeta, ToggleReady },
      turn: {
        activePlayers: ActivePlayers.ALL,
      },
      endIf: ({ G }) =>
        G.meta.players.length == 2 &&
        G.daemon?.players.every((playerID) => G.buffer.ready[playerID]),
      next: "beforePlay",
    },

    beforePlay: {
      endIf: () => true,
      onEnd: ({ G, random }) => {
        G.game = initGame(
          G.meta.stage,
          [StarterDeck, StarterDeck].map((e) => random.Shuffle(e))
        );
        G.buffer = {
          ready: Array(N + 1).fill(false),
          redrawQuota: Array(2).fill(G.meta.redrawQuota),
          moves: Array(2).fill(null),
          history: [],
        };
      },
      next: "play",
    },

    play: {
      moves: { UpdateState, PlayerMove, Redraw },
      turn: {
        activePlayers: ActivePlayers.ALL,
        endIf: ({ G }) => G.buffer.moves.every((e) => e),
        onEnd: ({ G }) => {
          const { moves } = G.buffer;
          if (moves.every((e) => e)) {
            G.game = moveGame(G.game, moves);
            G.buffer.moves = Array(2).fill(null);
            G.buffer.history.push(moves);
          }
        },
      },
      endIf: ({ G }) => G.game.round == 0,
      next: "beforePrepare",
    },
  },
};
