import { Client } from "boardgame.io/client";
import { TableturfGame } from "./Game";

class TableturfClient {
  private readonly client = Client({ game: TableturfGame });
  constructor() {
    this.client.start();
  }
}

const app = new TableturfClient();
