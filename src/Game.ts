import { Game } from "boardgame.io";
import { ActivePlayers, INVALID_MOVE } from "boardgame.io/core";
import { getLogger } from "loglevel";
import {
  GameState,
  initGame,
  isGameMoveValid,
  moveGame,
  PlayerMovement,
} from "./core/Tableturf";

const logger = getLogger("tableturf-game");
logger.setLevel("debug");

const STD_DECK = [33, 159, 92, 25, 30, 52, 65, 50, 66, 64, 53, 58, 28, 74, 69];

interface State {
  ready: boolean[];
  decks: number[][];
  stage: number;
  game: GameState | null;
  moves: PlayerMovement[];
}

export const TableturfGame: Game<State> = {
  setup: ({ ctx }) => ({
    ready: Array(2).fill(false),
    decks: Array(2).fill(STD_DECK),
    stage: 1,
    game: null,
    moves: [],
  }),

  phases: {
    prepare: {
      start: true,
      next: "main",
      onBegin: ({ G, ctx }) => {
        logger.log(`prepare.begin`);
        G.ready = Array(2).fill(false);
      },
      moves: {
        toggleReady: ({ G, playerID }) => {
          const player = parseInt(playerID);
          G.ready[player] = !G.ready[player];
        },
      },
      turn: {
        activePlayers: ActivePlayers.ALL,
      },
      endIf: ({ G }) => {
        return G.ready.every((e) => e);
      },
      onEnd: () => {
        logger.log(`prepare.end`);
      },
    },

    main: {
      onBegin: ({ G, ctx }) => {
        logger.log(`main.begin`);
        G.game = initGame(G.stage, G.decks);
      },
      moves: {
        move: ({ G, playerID }, move: PlayerMovement) => {
          const player = parseInt(playerID);
          if (move.player != player) {
            return INVALID_MOVE;
          }
          if (G.moves[player] != null) {
            return INVALID_MOVE;
          }
          if (!isGameMoveValid(G.game!, move)) {
            return INVALID_MOVE;
          }
          G.moves[player] = move;
        },
      },
      turn: {
        activePlayers: ActivePlayers.ALL,
        maxMoves: 2,
        onBegin: ({ G, ctx }) => {
          logger.log(`main.turn.begin`);
          G.moves = [];
        },
        onMove: ({ playerID }) => {
          logger.log(`main.turn.move: ${playerID}`);
        },
        endIf: ({ G, ctx }) => {
          return !!G.moves[0] && !!G.moves[1];
        },
        onEnd: ({ G, ctx }) => {
          logger.log(`main.turn.end`);
          G.game = moveGame(G.game!, G.moves);
        },
      },
      onEnd: () => {
        logger.log(`main.end`);
      },
    },
  },
};
