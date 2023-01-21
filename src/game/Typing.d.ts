// import type { ClientState } from "boardgame.io/dist/types/src/client/client";

// daemon state
// write = {daemon}
interface IDaemonState {
  players: string[]; // playerID[]
}

// match metadata
// read = {everyone}
// write = {daemon,host}
interface IMatchMeta {
  host: string; // playerID
  players: string[]; // playerID[2]
  stage: number;
  redrawQuota: number;
  timeQuotaSec?: {
    step: number;
    game: number;
  };
}

// buffer state
// read = {...}
// write = {everyone}
interface IBufferState {
  ready: boolean[]; // playerID -> ready
  redrawQuota: number[];
  moves: IPlayerMovement[];
  cards: number[][];
  history: IPlayerMovement[][];
}

interface IMatchState {
  daemon?: IDaemonState;
  game?: IGameState;
  meta: IMatchMeta;
  buffer: IBufferState;
}

// declare type IMatchControllerState = Exclude<ClientState<IMatchState>, null>;
