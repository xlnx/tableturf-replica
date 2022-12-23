import Cookies from "js-cookie";
import { getLogger } from "loglevel";
import { StarterDeck, TableturfPlayerInfo } from "./Game";

const logger = getLogger("database");
logger.setLevel("debug");

interface DBSchema {
  player: TableturfPlayerInfo;
}

export const DB: DBSchema = {
  player: {
    name: "Player",
    deck: StarterDeck.slice(),
  },
  ...JSON.parse(Cookies.get("db") || "{}"),
};

logger.log(DB);

window.addEventListener("beforeunload", () => {
  const expires = new Date();
  expires.setTime(expires.getTime() + 1000 * 36000);
  Cookies.set("db", JSON.stringify(DB));
  Cookies.set("expires", expires.toUTCString());
});
