import { IGameState, IPlayerMovement } from "tableturf-core/src/Types";
import { ClientState } from "boardgame.io/dist/types/src/client/client";

// daemon state
// write = {daemon}
export interface IDaemonState {
  players: string[]; // playerID[]
}

// match metadata
// read = {everyone}
// write = {daemon,host}
export interface IMatchMeta {
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
export interface IBufferState {
  ready: boolean[]; // playerID -> ready
  redrawQuota: number[];
  moves: IPlayerMovement[];
  history: IPlayerMovement[][];
}

export interface IMatchState {
  daemon?: IDaemonState;
  game?: IGameState;
  meta: IMatchMeta;
  buffer: IBufferState;
}

export type IMatchControllerState = Exclude<ClientState<IMatchState>, null>;
