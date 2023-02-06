import { EventDispatcher } from "./EventDispatcher";
import { Match } from "./Match";

export class MatchDriver extends EventDispatcher<IMatchDriverEvent> {
  private readonly moves: boolean[] = Array(2).fill(false);
  private readonly detach: any[] = [];

  constructor(readonly match: Match) {
    super();

    const state = match.client.getState();
    if (state) {
      state.G.buffer.moves.forEach((move, i) => (this.moves[i] = !!move));
    }

    match.on("update", (state, prevState) => {
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

      // game terminated, may be caused by three reasons
      // * someone disconnected -> abort
      // * someone give up -> finish(winner, "giveup")
      // * someone tle -> finish(winner, "tle")
      if (ctx.phase != "play" && G.game.round > 0) {
        if (!G.replay) {
          // someone disconnected
          this.dispatchEvent("abort");
        } else {
          this.dispatchEvent("finish", G.replay);
        }
        return;
      }

      // enter next round
      if (G.game.round == G0.game.round - 1) {
        G.buffer.prevMoves.forEach(checkMoveUpdate);
        this.moves.fill(false);
        if (G.game.round > 0) {
          // next round
          this.dispatchEvent("round", G.game.round);
        } else {
          // normal end
          this.dispatchEvent("finish", G.replay);
        }
      }
    });
  }

  on(event: "start", handler: () => any);
  on(event: "round", handler: (round: number) => any);
  on(event: "redraw", handler: (playerID: string) => any);
  on(event: "move", handler: (playerID: string, move: IPlayerMovement) => any);
  on(event: "finish", handler: (replay: IMatchReplay) => any);
  on(event: "abort", handler: () => any);

  on(event: IMatchDriverEvent, handler: any) {
    this.detach.push(this.registerEventHandler(event, handler));
  }

  stop() {
    this.detach.forEach((detach) => detach());
  }
}
