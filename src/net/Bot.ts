import { GameState, PlayerMovement } from "../core/Tableturf";

export interface BotCreateStateOptions {
  player: PlayerId;
}

export interface BotInfoBrief {
  name: string;
}

export interface BotInfo extends BotInfoBrief {}

export interface BotConnector {
  id: string;
  info: BotInfoBrief;
  connect: (timeout: number) => Promise<Bot>;
}

export abstract class Bot {
  async start(): Promise<this> {
    return this;
  }

  stop() {}

  abstract get info(): BotInfo;

  abstract createState(options: BotCreateStateOptions): Promise<BotState>;
}

export abstract class BotState {
  abstract initialize(game: GameState): Promise<void>;

  abstract query(): Promise<PlayerMovement>;

  abstract update(game: GameState, moves: PlayerMovement[]): Promise<void>;

  async finalize(): Promise<void> {}
}
