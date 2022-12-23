import { GameState, PlayerMovement } from "../core/Tableturf";

export abstract class BotState {
  abstract initialize(game: GameState): Promise<void>;

  abstract query(): Promise<PlayerMovement>;

  abstract update(game: GameState, moves: PlayerMovement[]): Promise<void>;

  async finalize(): Promise<void> {}
}

export interface BotCreateStateOptions {
  player: PlayerId;
}

export interface BotMeta {
  name: string;
}

export abstract class Bot {
  abstract createState(options: BotCreateStateOptions): Promise<BotState>;

  abstract close();

  getMeta(): BotMeta {
    return {
      name: "Bot",
    };
  }
}

export interface BotConnectOptions {
  onError: (err: Error) => void;
}

export type BotClass = {
  connect(options: BotConnectOptions): Promise<Bot>;
};
