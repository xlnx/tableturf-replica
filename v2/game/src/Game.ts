import { Game, PhaseConfig } from "boardgame.io";
import { ActivePlayers, INVALID_MOVE } from "boardgame.io/core";
import { ClientState } from "boardgame.io/dist/types/src/client/client";
import { initGame, isGameMoveValid, moveGame } from "tableturf-core/src/Api";
import {
  IGameState,
  IPlayerId,
  IPlayerMovement,
} from "tableturf-core/src/Types";

export interface TableturfPlayerInfo {
  name: string;
  deck: number[];
}

export interface TableturfGameState {
  // prepare phase
  players: (TableturfPlayerInfo | null)[];
  ready: boolean[];
  stage: number;
  redrawQuota: number;
  // game phase
  game: IGameState | null;
  redrawQuotaLeft: number[];
  moveHistory: (IPlayerMovement & { card: number })[][];
  moves: (IPlayerMovement & { card: number })[];
  // notifications
  sync: boolean[];
}

export type TableturfClientState = Exclude<
  ClientState<TableturfGameState>,
  null
>;

export const StarterDeck = [
  6, 13, 22, 28, 40, 34, 45, 52, 55, 56, 159, 137, 141, 103, 92,
];

export const TableturfGame: Game<TableturfGameState> = {
  name: "tableturf",

  maxPlayers: 4,

  setup: () => ({
    // prepare phase
    players: Array(2).fill(null),
    ready: Array(2).fill(false),
    stage: 1,
    redrawQuota: 1,
    // game phase
    game: null,
    moveHistory: [],
    moves: [null, null],
    redrawQuotaLeft: [],
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
      // next: "prepare",
      moves: {
        f: ({ playerID }) => console.log(`f(${playerID})`),
      },
    },
  },
};
