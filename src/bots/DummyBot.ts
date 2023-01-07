import { getLogger } from "loglevel";
import {
  BotSession,
  Bot,
  BotConnector,
  IBotCreateSessionResponse,
} from "../client/bot/Bot";
import { v4 } from "uuid";

const logger = getLogger("dummy-bot");
logger.setLevel("info");

export class DummyBot extends Bot {
  static readonly info: IBotInfo = {
    name: "Dummy",
    support: {
      stages: [2],
      decks: [],
    },
  };

  static readonly connector: BotConnector = {
    id: v4(),
    info: this.info,
    connect: async () => new DummyBot(),
  };

  get info(): IBotInfo {
    return DummyBot.info;
  }

  async createSession({}: IBotCreateSessionRequest): Promise<IBotCreateSessionResponse> {
    return { session: new DummyBotSession() };
  }
}

class DummyBotSession extends BotSession {
  async initialize({ game }: IBotSessionInitRequest): Promise<void> {
    logger.log("initialize", game);
  }

  async query(): Promise<IBotSessionQueryResponse> {
    logger.log("query");
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      action: "discard",
      hand: 0,
    };
  }

  async update({ game, moves }: IBotSessionUpdateRequest): Promise<void> {
    logger.log("update", game, moves);
  }

  async finalize(): Promise<void> {
    logger.log("finalize");
  }
}
