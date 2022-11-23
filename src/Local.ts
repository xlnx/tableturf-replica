import { Local } from "boardgame.io/multiplayer";
import { getLogger } from "loglevel";
import { Bot, BotClass, BotState } from "./bot/Bot";
import { DummyBot } from "./bot/DummyBot";
import { Client, Host } from "./Controller";
import { DB } from "./Database";
import {
  StarterDeck,
  TableturfClientState,
  TableturfGameState,
  TableturfPlayerInfo,
} from "./Game";

const logger = getLogger("local-client");
logger.setLevel("info");

const matchId = "Local";

class LocalHost_0 extends Host {
  private bot: Bot;
  private botState: BotState;
  private isBusy: boolean = false;

  constructor() {
    super({
      playerId: 1,
      matchId,
      multiplayer: Local(),
    });
  }

  connect(): Promise<Client> {
    const client = new (class extends Client {
      protected handleStateUpdate(state: TableturfClientState) {
        super.handleStateUpdate(state);
        if (!state.G.players[this.playerId]) {
          this.updatePlayerInfo(DB.player);
        }
      }
    })({
      playerId: 0,
      matchId,
      multiplayer: Local(),
    });

    return (client as any)._connect(9999);
  }

  async connectBot(cls: BotClass) {
    console.assert(!this.isBusy);
    console.assert(!this.botState);
    this.isBusy = true;
    try {
      const bot = await cls.connect({ onError: (err) => console.error(err) });
      const { name } = bot.getMeta();
      /* this section shall not throw */
      if (this.bot) {
        this.bot.close();
      }
      this.bot = bot;
      this.updatePlayerInfo({
        name,
        deck: StarterDeck.slice(),
      });
      /* this section shall not throw */
    } finally {
      this.isBusy = false;
    }
  }

  protected async handleStateUpdate(state: TableturfClientState) {
    const state0 = this._prevState || state;
    super.handleStateUpdate(state);
    const { G, ctx } = state;
    const { G: G0, ctx: ctx0 } = state0;
    if (ctx.phase == "prepare") {
      if (G.ready[1 - this.playerId] && !G.ready[this.playerId]) {
        if (this.bot && !this.isBusy) {
          await this._startGame(G);
        }
      }
    }

    if (ctx.phase == "init") {
      if (!G.sync[this.playerId] && !this.isBusy) {
        console.assert(this.bot && this.botState);
        this.isBusy = true;
        try {
          await this.botState.initialize(G.game);
        } finally {
          this.isBusy = false;
        }
        this.send("sync");
      }
    }

    const isNewRound = G.moveHistory.length == G0.moveHistory.length + 1;
    if (isNewRound) {
      console.assert(this.bot && this.botState);
      await this.botState.update(
        G.game,
        G.moveHistory[G.moveHistory.length - 1]
      );
      if (ctx.phase != "game") {
        await this.botState.finalize();
        this.botState = null;
      }
    }
    if (ctx.phase == "game") {
      if (ctx0.phase != "game" || (isNewRound && G.game.round > 0)) {
        const move = await this.botState.query();
        logger.log("bot move:", move);
        this.send("move", move);
      }
    }
  }

  private async _startGame(G: TableturfGameState): Promise<void> {
    console.assert(this.bot);
    console.assert(!this.isBusy);
    console.assert(!this.botState);
    this.isBusy = true;
    try {
      logger.log("start game");
      const state = await this.bot.createState({ player: this.playerId });
      const { ctx } = this.client.getState();
      console.assert(ctx.phase == "prepare");
      /* this section shall not throw */
      this.botState = state;
      this.updatePlayerInfo({
        // deck: TODO: fix this
      });
      this.send("toggleReady");
      /* this section shall not throw */
    } finally {
      this.isBusy = false;
    }
  }
}

export const LocalHost = new LocalHost_0();
await LocalHost.connectBot(DummyBot);
