import { getLogger } from "loglevel";
import {
  StarterDeck,
  TableturfClientState,
  TableturfPlayerInfo,
} from "../Game";
import { Bot, BotConnector, BotSession } from "./Bot";
import { Client } from "./Client";
import {
  LocalMaster,
  LocalTransport,
} from "boardgame.io/src/client/transport/local";
import { PlayerMovement } from "../core/Tableturf";

const logger = getLogger("bot-client");
logger.setLevel("debug");

const matchId = "bot";
const BotConnectTimeoutSec = 15;

let master: LocalMaster;

function Local(transportOpts): any {
  const { game } = transportOpts;
  if (!master) {
    master = new LocalMaster({ game });
  }
  return new LocalTransport({ master, ...transportOpts });
}

class BotClientImpl extends Client {
  private session: BotSession;

  constructor(private readonly bot: Bot) {
    super({
      playerId: 1,
      matchId,
      multiplayer: Local,
    });
    this.on("update", this._handleUpdate.bind(this));
  }

  stop() {
    this.bot.stop();
    super.stop();
  }

  protected getDefaultPlayerInfo(): TableturfPlayerInfo {
    return {
      name: this.bot.info.name,
      deck: StarterDeck.slice(),
    };
  }

  private async _handleUpdate(
    { G, ctx }: TableturfClientState,
    { G: G0, ctx: ctx0 }: TableturfClientState
  ) {
    logger.log(ctx.phase, G);

    const enter = (phase: string) =>
      ctx.phase == phase && ctx0.phase != ctx.phase;

    if (ctx.phase == "prepare" && !G.ready[this.playerId]) {
      this.send("toggleReady", true);
    }

    // prepare
    if (enter("prepare")) {
      this.session = null;
    }

    // botInitHook
    if (enter("botInitHook")) {
      console.assert(this.session == null);
      const { session, deck } = await this.bot.createSession({
        player: this.playerId,
        stage: G.stage,
        deck: G.players[this.playerId].deck.slice(),
      });
      logger.log("create session ->", { session, deck });
      this.session = session;
      this.send("updatePlayerInfo", { deck });
      this.send("sync");
    }

    // init
    if (enter("init")) {
      this.session.initialize({ game: G.game });
      this.send("sync");
    }

    if (
      enter("game") ||
      (G.moveHistory.length == G0.moveHistory.length + 1 && G.game.round > 0)
    ) {
      const move: PlayerMovement = {
        ...(await this.session.query()),
        player: this.playerId,
      };
      this.send("move", move);
    }
  }
}

export class BotClient extends Client {
  private readonly impl: BotClientImpl;

  private constructor(bot: Bot) {
    super({
      playerId: 0,
      matchId,
      multiplayer: Local,
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
    master = null;
  }

  static async connect(connector: BotConnector) {
    const bot = await connector.connect(BotConnectTimeoutSec);
    return await new BotClient(bot).start(1e10);
  }
}
