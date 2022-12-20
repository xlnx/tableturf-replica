import {
  StarterDeck,
  TableturfClientState,
  TableturfPlayerInfo,
} from "../Game";
import { Bot, BotConnector } from "./Bot";
import { Client } from "./Client";
import { Local } from "boardgame.io/multiplayer";

const matchId = "bot";

const BotConnectTimeoutSec = 15;

class BotClientImpl extends Client {
  constructor(private readonly bot: Bot) {
    super({
      playerId: 1,
      matchId,
      multiplayer: Local(),
    });
    this.on("update", this._handleUpdate.bind(this));
  }

  protected getDefaultPlayerInfo(): TableturfPlayerInfo {
    return {
      name: this.bot.info.name,
      deck: StarterDeck.slice(),
    };
  }

  private _handleUpdate(
    { G, ctx }: TableturfClientState,
    { G: G0, ctx: ctx0 }: TableturfClientState
  ) {
    console.log(ctx.phase, G);

    const enter = (phase: string) =>
      ctx.phase == phase && ctx0.phase != ctx.phase;

    if (ctx.phase == "prepare" && !G.ready[this.playerId]) {
      this.send("toggleReady", true);
    }

    // botInitHook
    if (enter("botInitHook")) {
      this.send("sync");
    }

    // init
    if (enter("init")) {
      this.send("sync");
    }
  }
}

export class BotClient extends Client {
  private readonly impl: BotClientImpl;

  private constructor(bot: Bot) {
    super({
      playerId: 0,
      matchId,
      multiplayer: Local(),
    });
    this.impl = new BotClientImpl(bot);
  }

  async start(timeout: number): Promise<this> {
    await Promise.all([super.start(timeout), this.impl.start(timeout)]);
    return this;
  }

  stop() {
    this.impl.stop();
    super.stop();
  }

  static async connect(connector: BotConnector) {
    const bot = await connector.connect(BotConnectTimeoutSec);
    return await new BotClient(bot).start(1e10);
  }
}
