import { GameState, PlayerMovement } from "../core/Tableturf";

export interface BotInfoBrief {
  name: string;
}

export interface BotInfo extends BotInfoBrief {
  support: {
    // the stages supported by this bot, [] for any
    stages: number[];
    // does this bot support any deck
    anyDeck: boolean;
  };
}

export interface CreateSessionRequest {
  // given player id
  player: PlayerId;
  // given stage
  stage: number;
  // undefined => bot selects deck
  // number[] => given deck
  deck?: number[];
}

export interface CreateSessionResponse {
  // the created session
  session: BotSession;
  // the selected deck if request.deck == undefined
  deck?: number[];
}

export interface BotSessionInitRequest {
  game: GameState;
}

export type BotSessionQueryResponse = Omit<PlayerMovement, "player">;

export interface BotSessionUpdateRequest {
  game: GameState;
  moves: PlayerMovement[];
}

export abstract class Bot {
  async start(): Promise<this> {
    return this;
  }

  stop() {}

  abstract get info(): BotInfo;

  abstract createSession(
    request: CreateSessionRequest
  ): Promise<CreateSessionResponse>;
}

export abstract class BotSession {
  abstract initialize(request: BotSessionInitRequest): Promise<void>;

  abstract query(): Promise<BotSessionQueryResponse>;

  abstract update(request: BotSessionUpdateRequest): Promise<void>;

  async finalize(): Promise<void> {}
}

export interface BotConnector {
  id: string;
  info: BotInfoBrief;
  connect: (timeout: number) => Promise<Bot>;
}
