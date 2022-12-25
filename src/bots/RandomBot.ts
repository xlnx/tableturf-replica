import { getLogger } from "loglevel";
import {
  BotSession,
  Bot,
  BotConnector,
  IBotCreateSessionResponse,
} from "../client/bot/Bot";
import { v4 } from "uuid";
import { StarterDeck } from "../Game";
import { enumerateGameMoves } from "../core/Tableturf";

const logger = getLogger("random-bot");
logger.setLevel("info");

export class RandomBot extends Bot {
  static readonly info: IBotInfo = {
    name: "Random",
    support: {
      stages: [],
      anyDeck: true,
    },
  };

  static readonly connector: BotConnector = {
    id: v4(),
    info: this.info,
    connect: async () => new RandomBot(),
  };

  get info(): IBotInfo {
    return RandomBot.info;
  }

  async createSession({
    deck,
  }: IBotCreateSessionRequest): Promise<IBotCreateSessionResponse> {
    return {
      session: new RandomBotSession(),
      deck: deck || StarterDeck.slice(),
    };
  }
}

class RandomBotSession extends BotSession {
  private player: IPlayerId;
  private game: IGameState;

  async initialize({ player, game }: IBotSessionInitRequest): Promise<void> {
    logger.log("initialize", game);
    this.player = player;
    this.game = game;
  }

  async query(): Promise<IBotSessionQueryResponse> {
    logger.log("query");
    await new Promise((resolve) => setTimeout(resolve, 500));
    const li = enumerateGameMoves(this.game, this.player);
    const i = Math.floor(Math.random() * li.length) % li.length;
    return li[i];
  }

  async update({ game, moves }: IBotSessionUpdateRequest): Promise<void> {
    logger.log("update", game, moves);
    this.game = game;
  }

  async finalize(): Promise<void> {
    logger.log("finalize");
  }
}
