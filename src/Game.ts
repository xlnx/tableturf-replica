import { Game, PhaseConfig } from "boardgame.io";
import { ActivePlayers, INVALID_MOVE } from "boardgame.io/core";
import { ClientState } from "boardgame.io/dist/types/src/client/client";
import { getLogger } from "loglevel";
import { initGame, isGameMoveValid, moveGame } from "./core/Tableturf";

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

const updateState = {
  move: ({ G }, G1: Partial<TableturfGameState>) => {
    Object.assign(G, G1);
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
      next: "prepare",
    },

    prepare: {
      onBegin: () => logger.debug(`prepare.begin`),
      moves: {
        toggleReady,
        updatePlayerInfo,
        updateState,
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
        return {
          ...G,
          game: initGame(
            G.stage,
            G.players.map((e) => random.Shuffle(e.deck))
          ),
          moveHistory: [],
          moves: Array(2).fill(null),
          redrawQuotaLeft: Array(2).fill(G.redrawQuota),
        };
      },
      next: "game",
    }),

    game: {
      onBegin: () => logger.debug(`game.begin`),
      moves: {
        redraw: {
          move: ({ G, random, playerID }) => {
            const player = <IPlayerId>parseInt(playerID);
            // one can only redraw at the beginning of a match
            if (G.game.round != 12) {
              return INVALID_MOVE;
            }
            if (G.redrawQuotaLeft[player] <= 0) {
              return INVALID_MOVE;
            }
            const players = G.game.players.slice();
            const { hand, deck, ...rest } = players[player];
            const newDeck = random.Shuffle(hand.concat(deck));
            const newHand = newDeck.splice(0, 4);
            players[player] = { ...rest, hand: newHand, deck: newDeck };
            G.game = { ...G.game, players };
            G.redrawQuotaLeft[player] -= 1;
          },
          ignoreStaleStateID: true,
        },
        move: {
          move: ({ G, playerID }, _move: Omit<IPlayerMovement, "player">) => {
            const player = <IPlayerId>parseInt(playerID);
            const move: IPlayerMovement = {
              ..._move,
              player,
            };
            if (G.moves[player] != null) {
              return INVALID_MOVE;
            }
            if (!isGameMoveValid(G.game, move)) {
              return INVALID_MOVE;
            }
            G.redrawQuotaLeft[player] = 0;
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
