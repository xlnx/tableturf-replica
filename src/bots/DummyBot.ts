import { getLogger } from "loglevel";
import {
  CreateSessionRequest,
  BotInfo,
  BotSession,
  Bot,
  BotConnector,
  CreateSessionResponse,
  BotSessionQueryResponse,
  BotSessionInitRequest,
  BotSessionUpdateRequest,
} from "../net/Bot";
import { v4 } from "uuid";
import { StarterDeck } from "../Game";

const logger = getLogger("dummy-bot");
logger.setLevel("info");

export class DummyBot extends Bot {
  static readonly info: BotInfo = {
    name: "Dummy",
    support: {
      stages: [],
      anyDeck: true,
    },
  };

  static readonly connector: BotConnector = {
    id: v4(),
    info: this.info,
    connect: async () => new DummyBot(),
  };

  get info(): BotInfo {
    return DummyBot.info;
  }

  async createSession({
    deck,
  }: CreateSessionRequest): Promise<CreateSessionResponse> {
    return {
      session: new DummyBotSession(),
      deck: deck || StarterDeck.slice(),
    };
  }
}

class DummyBotSession extends BotSession {
  async initialize({ game }: BotSessionInitRequest): Promise<void> {
    logger.log("initialize", game);
  }

  async query(): Promise<BotSessionQueryResponse> {
    logger.log("query");
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      action: "discard",
      hand: 0,
    };
  }

  async update({ game, moves }: BotSessionUpdateRequest): Promise<void> {
    logger.log("update", game, moves);
  }

  async finalize(): Promise<void> {
    logger.log("finalize");
  }
}
