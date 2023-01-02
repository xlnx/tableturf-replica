import Cookies from "js-cookie";
import { getLogger } from "loglevel";
import { StarterDeck } from "./Game";

const logger = getLogger("database");
logger.setLevel("debug");

const defaultData: IRootData = {
  playerName: "Player",
  decks: [...Array(10).keys()].map((i) => ({
    name: i == 0 ? "Starter Deck" : `Deck ${i}`,
    deck: StarterDeck.slice(),
  })),
  currDeck: 0,
};

class Database {
  private handlers: (() => void)[] = [];

  private data: IRootData = {
    ...defaultData,
    ...JSON.parse(Cookies.get("db") || "{}"),
  };

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
