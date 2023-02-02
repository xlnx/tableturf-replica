// import type { ClientState } from "boardgame.io/dist/types/src/client/client";

// daemon state
// write = {daemon}
interface IDaemonState {
  players: string[]; // playerID[]
  decks: number[][];
}

// match metadata
// read = {everyone}
// write = {daemon,host}
interface IMatchMeta {
  host: string; // playerID
  players: string[]; // playerID[2]
  stage: number;
  redrawQuota: number;
  stepTimeQuotaSec: number | null;
}

// buffer state
// read = {...}
// write = {everyone}
interface IBufferState {
  ready: boolean[]; // playerID -> ready
  // [p1, p2] -> ...
  redrawQuota: number[];
  tle: boolean;
  giveUp: boolean[];
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

interface IHandshake {
  deck: number[];
}

// declare type IMatchControllerState = Exclude<ClientState<IMatchState>, null>;
