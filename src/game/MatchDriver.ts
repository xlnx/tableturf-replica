import { ClientState } from "boardgame.io/dist/types/src/client/client";
import { EventDispatcher } from "./EventDispatcher";
import { Match } from "./Match";

type Event = "start" | "round" | "redraw" | "move" | "finish" | "abort";

export class MatchDriver extends EventDispatcher<Event> {
  private readonly moves: boolean[] = Array(2).fill(false);
  private readonly detach: any[] = [];

  constructor(readonly match: Match) {
    super();
    match.on("update", this.handleUpdate.bind(this));
    const { G, ctx } = match.client.getState();
    G.buffer.moves.forEach((move, i) => (this.moves[i] = !!move));
  }

  on(event: "start", handler: () => any);
  on(event: "round", handler: (round: number) => any);
  on(event: "redraw", handler: (playerID: string) => any);
  on(event: "move", handler: (playerID: string, move: IPlayerMovement) => any);
  on(event: "finish", handler: () => any);
  on(event: "abort", handler: () => any);

  on(event: Event, handler: any) {
    this.detach.push(this.registerEventHandler(event, handler));
  }

  stop() {
    this.detach.forEach((detach) => detach());
  }

  private handleUpdate(
    state: ClientState<IMatchState>,
    prevState: ClientState<IMatchState>
  ) {
    const { G, ctx } = state;
    const { G: G0, ctx: ctx0 } = prevState;

    if (ctx.phase != "play" && ctx0.phase != "play") {
      return;
    }

    if (ctx0.phase != "play") {
      // enter first round
      this.dispatchEvent("start");
      this.dispatchEvent("round", G.game.round);
      this.moves.fill(false);
      return;
    }

    if (G.game.round == 12) {
      G.buffer.redrawQuota.forEach((v, i) => {
        if (!G.buffer.moves[i] && v == G0.buffer.redrawQuota[i] - 1) {
          this.dispatchEvent("redraw", G.meta.players[i]);
        }
      });
    }

    const checkMoveUpdate = (move: IPlayerMovement, i: number) => {
      if (move && !this.moves[i]) {
        this.dispatchEvent("move", G.meta.players[i], move);
        this.moves[i] = true;
      }
    };
    G.buffer.moves.forEach(checkMoveUpdate);

    if (ctx.phase != "play") {
      if (G.game.round > 0) {
        this.dispatchEvent("abort");
        return;
      }
    }

    // enter next round
    if (G.game.round == G0.game.round - 1) {
      G.buffer.history.slice(-1)[0].forEach(checkMoveUpdate);
      this.moves.fill(false);
      if (G.game.round > 0) {
        this.dispatchEvent("round", G.game.round);
      } else {
        this.dispatchEvent("finish");
      }
    }
  }
}
