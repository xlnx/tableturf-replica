import { Game, PhaseConfig } from "boardgame.io";
import { ActivePlayers, INVALID_MOVE } from "boardgame.io/core";
import { ClientState } from "boardgame.io/dist/types/src/client/client";
import { getLogger } from "loglevel";
import {
  GameState,
  initGame,
  isGameMoveValid,
  moveGame,
  PlayerMovement,
} from "./core/Tableturf";

const logger = getLogger("tableturf-game");
logger.setLevel("info");

export interface TableturfPlayerInfo {
  name: string;
  deck: number[];
}

export interface TableturfGameState {
  // prepare phase
  players: (TableturfPlayerInfo | null)[];
  ready: boolean[];
  stage: number;
  // game phase
  game: GameState | null;
  moveHistory: (PlayerMovement & { card: number })[][];
  moves: (PlayerMovement & { card: number })[];
  // notifications
  sync: boolean[];
}

export type TableturfClientState = Exclude<
  ClientState<TableturfGameState>,
  null
>;

const barrier = ({
  moves,
  ...rest
}: Partial<PhaseConfig<TableturfGameState>>) => ({
  moves: {
    sync: {
      move: ({ G, playerID }) => {
        const player = parseInt(playerID);
        G.sync[player] = true;
      },
      ignoreStaleStateID: true,
    },
    ...moves,
  },
  turn: {
    activePlayers: ActivePlayers.ALL,
  },
  endIf: ({ G }) => G.sync.every((e) => e),
  onEnd: ({ G }) => {
    G.sync = Array(2).fill(false);
  },
  ...rest,
});

export const StarterDeck = [
  6, 13, 22, 28, 40, 34, 45, 52, 55, 56, 159, 137, 141, 103, 92,
];
// don't use my deck
// [
//   33, 159, 92, 25, 30, 52, 65, 50, 66, 64, 53, 58, 28, 74, 69,
// ];

const toggleReady = {
  move: ({ G, playerID }, ready?: boolean) => {
    const player = parseInt(playerID);
    G.ready[player] = ready == null ? !G.ready[player] : ready;
  },
  ignoreStaleStateID: true,
};

const updatePlayerInfo = {
  move: ({ G, playerID }, info: Partial<TableturfPlayerInfo>) => {
    const player = parseInt(playerID);
    G.players[player] = { ...G.players[player], ...info };
  },
  ignoreStaleStateID: true,
};

const resetPlayerInfo = {
  move: ({ G }, player: PlayerId) => {
    G.players[player] = null;
  },
  ignoreStaleStateID: true,
};

export const TableturfGame: Game<TableturfGameState> = {
  name: "tableturf",

  minPlayers: 1,
  maxPlayers: 2,

  setup: () => ({
    // prepare phase
    players: Array(2).fill(null),
    ready: Array(2).fill(false),
    stage: 1,
    // game phase
    game: null,
    moveHistory: [],
    moves: [null, null],
    // notifications
    sync: [false, false],
  }),

  phases: {
    reset: {
      start: true,
      endIf: () => true,
      onEnd: ({ G }) => {
        G.ready = Array(2).fill(false);
      },
      next: "prepare",
    },

    prepare: {
      onBegin: () => logger.debug(`prepare.begin`),
      moves: {
        toggleReady,
        updatePlayerInfo,
        resetPlayerInfo,
      },
      turn: {
        activePlayers: ActivePlayers.ALL,
      },
      endIf: ({ G }) => G.ready.every((e) => e),
      onEnd: () => logger.debug(`prepare.end`),
      next: "botInitHook",
    },

    botInitHook: barrier({
      moves: {
        updatePlayerInfo,
      },
      next: "init",
    }),

    init: barrier({
      onBegin: ({ G, random }) => {
        // TODO: shuffle cards here
        G.game = initGame(
          G.stage,
          G.players.map((e) => random.Shuffle(e.deck))
        );
        G.moves = Array(2).fill(null);
        // G.game.round = 0;
      },
      next: "game",
    }),

    game: {
      onBegin: () => logger.debug(`game.begin`),
      moves: {
        move: {
          move: ({ G, playerID }, _move: Omit<PlayerMovement, "player">) => {
            const player = <PlayerId>parseInt(playerID);
            const move: PlayerMovement = {
              ..._move,
              player,
            };
            if (G.moves[player] != null) {
              return INVALID_MOVE;
            }
            if (!isGameMoveValid(G.game!, move)) {
              return INVALID_MOVE;
            }
            G.moves[player] = {
              ...move,
              card: G.game.players[player].hand[move.hand],
            };
          },
          ignoreStaleStateID: true,
        },
      },
      turn: {
        activePlayers: ActivePlayers.ALL,
        maxMoves: 2,
        endIf: ({ G }) => G.moves.every((e) => e),
        onEnd: ({ G }) => {
          if (G.moves.every((e) => e)) {
            G.moveHistory.push(G.moves);
            G.game = moveGame(G.game, G.moves);
            G.moves = Array(2).fill(null);
          }
        },
      },
      endIf: ({ G }) => G.game.round == 0,
      onEnd: () => logger.debug(`game.end`),
      next: "reset",
    },
  },
};
