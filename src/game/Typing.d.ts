/**
 * Match Driver Typings
 */
declare type IMatchDriverEvent =
  | "start"
  | "round"
  | "redraw"
  | "move"
  | "finish"
  | "abort";
declare type IMatchFinishReason = "normal" | "tle" | "giveup";

interface IPlayerRedraw {
  hands: number[];
  deck: number[];
}

/**
 * Match Replay Typings
 */
interface IMatchReplay {
  players: string[];
  winner: IPlayerId | null;
  finishReason: IMatchFinishReason;
  startTime: string;
  finishTime: string;
  stage: number;
  decks: number[][];
  redraws: IPlayerRedraw[][];
  moves: IPlayerMovement[][];
}

/**
 * Match State Typings
 */

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
  turnTimeQuotaSec: number;
}

// buffer state
// read = {...}
// write = {everyone}
interface IBufferState {
  ready: boolean[]; // playerID -> ready
  // [p1, p2] -> ...
  redrawQuota: number[];
  timestamp: string; // turn start time in iso string
  tle: boolean;
  giveUp: boolean[];
  moves: IPlayerMovement[];
  prevMoves: IPlayerMovement[];
  cards: number[][];
}

interface IMatchState {
  daemon?: IDaemonState;
  game?: IGameState;
  meta: IMatchMeta;
  buffer: IBufferState;
  replay?: IMatchReplay;
}

interface IHandshake {
  deck: number[];
}
