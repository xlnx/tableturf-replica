import { getLogger } from "loglevel";
import { GamePlayWindow } from "./ui/GamePlayWindow";
import { InkResetAnimation } from "./ui/InkResetAnimation";
import { TryOutWindow } from "./ui/TryOutWindow";
import { MessageBar } from "./ui/components/MessageBar";
import { Controller } from "./Controller";
import { Window } from "./engine/Window";
import { TableturfClientState, TableturfPlayerInfo } from "./Game";
import { LocalHost } from "./Local";
// import { P2PClient, P2PHost } from "./P2P";
import { DB } from "./Database";

const logger = getLogger("lobby");
logger.setLevel("debug");

/**
 * @deprecated
 */
class Lobby_0 {
  private controller: Controller;

  /**
   * @deprecated
   */
  constructor() {
    Controller.subscribe(this._updateState.bind(this));
  }

  /**
   * @deprecated
   */
  get matchId() {
    return this.controller.matchId;
  }

  /**
   * @deprecated
   */
  get playerId() {
    return this.controller.playerId;
  }

  /**
   * @deprecated
   */
  isOnline() {
    return this.controller instanceof P2PClient || this.controller == P2PHost;
  }

  /**
   * @deprecated
   */
  isPreparing() {
    return this.controller.client.getState().ctx.phase == "prepare";
  }

  /**
   * @deprecated
   */
  send(method: string, ...args: any[]) {
    logger.log(`send: ${method}`, args);
    this.controller && this.controller.send(method, ...args);
  }

  /**
   * @deprecated
   */
  activate(controller: Controller) {
    logger.log("stopping controller:", this.controller);
    this.controller && this.controller.stop();
    logger.log("activating controller:", controller);
    this.controller = controller;
    controller.activate();
  }

  /**
   * @deprecated
   */
  togglePixiWindow(wnd: Window) {
    InkResetAnimation.play(async () => wnd.show());
  }

  /**
   * @deprecated
   */
  acceptClient(): boolean {
    return this.isPreparing();
  }

  /**
   * @deprecated
   */
  updatePlayerInfo(player: Partial<TableturfPlayerInfo>) {
    DB.player = { ...DB.player, ...player };
    this.controller && this.controller.updatePlayerInfo(DB.player);
  }

  /**
   * @deprecated
   */
  async connectLocal() {
    this.activate(await LocalHost.connect());
  }

  /**
   * @deprecated
   */
  async connectP2P(matchId: string, timeout: number) {
    const client = await P2PClient.connect(matchId, timeout);
    this.activate(client);
    MessageBar.success(`connection established: ${matchId}`);
  }

  /**
   * @deprecated
   */
  async handleClientConenct() {
    MessageBar.success(`\${player} joint the room.`);
    this.activate(P2PHost);
  }

  /**
   * @deprecated
   */
  async handleP2PDisconnect() {
    MessageBar.warning(`\${player} left the room.`);
    InkResetAnimation.play(async () => {
      await Lobby.connectLocal();
      TryOutWindow.show();
    });
  }

  /**
   * @deprecated
   */
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
