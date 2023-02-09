import Cookies from "js-cookie";
import { getLogger } from "loglevel";
import { StarterDeck } from "./game/MatchController";
import { calibrateDeck } from "./Terms";

const logger = getLogger("database");
logger.setLevel("debug");

const maxDeckCount = 16;

const defaultData: IRootData = {
  playerName: "Player",
  decks: [],
  currDeck: 0,
};

class Database {
  private handlers: (() => void)[] = [];

  private data: IRootData = {
    ...defaultData,
    ...JSON.parse(Cookies.get("db") || "{}"),
  };

  constructor() {
    this.data.decks.splice(maxDeckCount);
    if (this.data.decks.length < maxDeckCount) {
      for (let i = this.data.decks.length; i < maxDeckCount; ++i) {
        this.data.decks.push({
          name: i == 0 ? "Starter Deck" : `Deck ${i}`,
          deck: StarterDeck.slice(),
        });
      }
    }
    this.data.decks = this.data.decks.map(({ deck, ...rest }) => ({
      deck: calibrateDeck(deck),
      ...rest,
    }));
  }

  update(data: Partial<IRootData>) {
    this.data = { ...this.data, ...data };
    Cookies.set("db", JSON.stringify(this.data), { expires: 365 });
    this.handlers.forEach((handler) => handler());
  }

  read(): IRootData {
    return { ...this.data };
  }

  subscribe(handler: () => void) {
    handler();
    this.handlers.push(handler);
  }
}

export const DB = new Database();
logger.log(DB);
