import Cookies from "js-cookie";
import { getLogger } from "loglevel";
import { StarterDeck } from "./Game";

const logger = getLogger("database");
logger.setLevel("debug");

interface IDeckData {
  name: string;
  deck: number[];
}

interface IRootData {
  playerName: string;
  decks: IDeckData[];
  currDeck: number;
}

const defaultData: IRootData = {
  playerName: "Player",
  decks: [
    {
      name: "Starter Deck",
      deck: StarterDeck.slice(),
    },
  ],
  currDeck: 0,
};

class Database {
  data: IRootData = {
    ...defaultData,
    ...JSON.parse(Cookies.get("db") || "{}"),
  };

  update(data: Partial<IRootData>) {
    this.data = { ...this.data, ...data };
    Cookies.set("db", JSON.stringify(this.data), { expires: 365 });
  }

  read(): IRootData {
    return { ...this.data };
  }
}

export const DB = new Database();
logger.log(DB);
