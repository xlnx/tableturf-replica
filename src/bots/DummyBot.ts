import { getLogger } from "loglevel";
import { GameState, PlayerMovement } from "../core/Tableturf";
import {
  BotCreateStateOptions,
  BotInfo,
  BotState,
  Bot,
  BotConnector,
} from "../net/Bot";
import { v4 } from "uuid";

const logger = getLogger("dummy-bot");
logger.setLevel("info");

class DummyBotState extends BotState {
  constructor(private readonly player: PlayerId) {
    super();
  }

  async initialize(game: GameState): Promise<void> {
    logger.log("initialize", game);
  }

  async query(): Promise<PlayerMovement> {
    logger.log("query");
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      player: this.player,
      action: "discard",
      hand: 0,
    };
  }

  async update(game: GameState, moves: PlayerMovement[]): Promise<void> {
    logger.log("update", game, moves);
  }

  async finalize(): Promise<void> {
    logger.log("finalize");
  }
}

export class DummyBot extends Bot {
  static readonly info: BotInfo = {
    name: "Dummy",
  };

  static readonly connector: BotConnector = {
    id: v4(),
    info: this.info,
    connect: async () => new DummyBot(),
  };

  get info(): BotInfo {
    return DummyBot.info;
  }

  async createState({ player }: BotCreateStateOptions): Promise<BotState> {
    return new DummyBotState(player);
  }
}
