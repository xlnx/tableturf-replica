import { getLogger } from "loglevel";
import { GamePlayWindow } from "./ui/GamePlayWindow";
import { InkResetAnimation } from "./ui/InkResetAnimation";
import { TryOutWindow } from "./ui/TryOutWindow";
import { MessageBar } from "./ui/components/MessageBar";
import { Controller } from "./Controller";
import { Window } from "./engine/Window";
import { TableturfClientState, TableturfPlayerInfo } from "./Game";
import { LocalHost } from "./Local";
import { P2PClient, P2PHost } from "./P2P";
import { DB } from "./Database";

const logger = getLogger("lobby");
logger.setLevel("debug");

class Lobby_0 {
  private controller: Controller;

  constructor() {
    Controller.subscribe(this._updateState.bind(this));
  }

  get matchId() {
    return this.controller.matchId;
  }

  get playerId() {
    return this.controller.playerId;
  }

  isOnline() {
    return this.controller instanceof P2PClient || this.controller == P2PHost;
  }

  isPreparing() {
    return this.controller.client.getState().ctx.phase == "prepare";
  }

  send(method: string, ...args: any[]) {
    logger.log(`send: ${method}`, args);
    this.controller && this.controller.send(method, ...args);
  }

  activate(controller: Controller) {
    logger.log("stopping controller:", this.controller);
    this.controller && this.controller.stop();
    logger.log("activating controller:", controller);
    this.controller = controller;
    controller.activate();
  }

  togglePixiWindow(wnd: Window) {
    InkResetAnimation.play(async () => wnd.show());
  }

  acceptClient(): boolean {
    return this.isPreparing();
  }

  updatePlayerInfo(player: Partial<TableturfPlayerInfo>) {
    DB.player = { ...DB.player, ...player };
    this.controller && this.controller.updatePlayerInfo(DB.player);
  }

  async connectLocal() {
    this.activate(await LocalHost.connect());
  }

  async connectP2P(matchId: string, timeout: number) {
    const client = await P2PClient.connect(matchId, timeout);
    this.activate(client);
    MessageBar.success(`connection established: ${matchId}`);
  }

  async handleClientConenct() {
    MessageBar.success(`\${player} joint the room.`);
    this.activate(P2PHost);
  }

  async handleP2PDisconnect() {
    MessageBar.warning(`\${player} left the room.`);
    InkResetAnimation.play(async () => {
      await Lobby.connectLocal();
      TryOutWindow.show();
    });
  }

  private _updateState(
    { G, ctx }: TableturfClientState,
    { G: G0, ctx: ctx0 }: TableturfClientState
  ) {
    const enter = (phase: string) =>
      ctx.phase == phase && ctx0.phase != ctx.phase;

    if (enter("init")) {
      InkResetAnimation.play(async () => {
        GamePlayWindow.uiReset(G);
        GamePlayWindow.show();
      });
    }
  }
}

export const Lobby = new Lobby_0();
await Lobby.connectLocal();
