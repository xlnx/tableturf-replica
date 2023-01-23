import { Box, Paper } from "@mui/material";
import { ReactComponent } from "../../../engine/ReactComponent";
import { Match } from "../../../game/Match";
import { MatchDriver } from "../../../game/MatchDriver";
import { AlertDialog } from "../../components/AlertDialog";
import { GUI } from "./GUI";
import { Hands } from "./Hands";
import { moveBoard } from "../../../core/Tableturf";

interface SpectatorPanelProps {
  gui: GUI;
  active: boolean;
}

export class SpectatorPanel extends ReactComponent<SpectatorPanelProps> {
  private readonly hands = [new Hands(), new Hands()];
  private detach: any[] = [];

  init() {
    return {
      gui: null,
      active: false,
    };
  }

  constructor() {
    super();
    this.hands.forEach((hands, i) => {
      hands.update({ player: i as IPlayerId });
    });
  }

  render() {
    return (
      <Box sx={{ visibility: this.props.active ? "visible" : "hidden" }}>
        {this.hands.map((hands, i) => (
          <Box key={i}>
            <Paper
              sx={{
                position: "absolute",
                left: 0 + i * 1375,
                top: 135,
                width: 545,
                height: 675,
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                boxShadow: "2px 2px rgba(0, 0, 0, 0.4)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                left: 28 + i * 1372,
                top: 160,
                width: 510,
                height: 640,
              }}
            >
              {hands.node}
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  bind(match: Match) {
    const { gui } = this.props;

    let G0 = match.client.getState().G;
    const players: IPlayerId[] = [0, 1];
    let active = false;

    this.detach.forEach((f) => f());
    const driver = new MatchDriver(match);

    const uiReset = async (G: IMatchState) => {
      gui.board.position.set(8, -16);
      gui.board.update({ acceptInput: false });
      gui.board.uiUpdateOverlay(null);
      gui.szMeter.position.set(-500, 300);
      gui.szMeter.roots[1].position.set(980, 190);
      gui.spCutInAnim.position.set(-86, 0);
      await gui.update({
        visibility: { slots: false },
      });
      await gui.reset(G, players, { flipCards: true });
      await Promise.all(
        G.game.players.map(async ({ hand }, i) => {
          await this.hands[i].update({ cards: hand });
          if (G.buffer.moves[i]) {
            await uiUpdatePlayerMove(G, G.buffer.moves[i]);
          }
        })
      );
    };

    const uiUpdatePlayerMove = async (
      G: IMatchState,
      move: IPlayerMovement
    ) => {
      const { player, action, hand, params } = move;
      const mask = Array(4).fill(false);
      mask[hand] = true;
      await this.hands[player].update({ mask });
      if (G.buffer.moves[player] && action != "discard") {
        const e: ICardPlacement = {
          player,
          card: G.game.players[player].hand[hand],
          rotation: params.rotation,
          position: params.position,
        };
        gui.board.uiUpdateOverlay(e);
        const { count } = moveBoard(G.game.board, [e]);
        gui.szMeter.update({
          preview: true,
          preview1: count.area[0],
          preview2: count.area[1],
        });
      }
    };

    const handleStart = () => {
      const { G } = match.client.getState();
      G0 = G;
      active = G.meta.players.indexOf(match.playerID) < 0;
      this.update({ active });
      if (!active) return;
      gui.show(async () => await uiReset(G));
    };

    if (match.client.getState().ctx.phase == "play") {
      handleStart();
    }

    driver.on("start", handleStart);

    driver.on("move", (_, move) => {
      if (!active) return;
      const { G } = match.client.getState();
      gui.uiNonBlocking(async () => await uiUpdatePlayerMove(G, move));
    });

    const uiUpdate = async (G: IMatchState) => {
      gui.board.uiUpdateOverlay(null);
      await gui.uiUpdate(G, G0, players, async () => {
        await Promise.all(
          [0, 1].map(async (i) => {
            const cards = Array(4);
            const { hand } = G.buffer.history.slice(-1)[0][i];
            cards[hand] = G.game.players[i].hand[hand];
            await this.hands[i].update({ mask: Array(4).fill(true) });
            await this.hands[i].uiUpdate(cards);
          })
        );
      });
      G0 = G;
    };

    const uiRedraw = async (G: IMatchState, playerID: string) => {
      const player = G.meta.players.indexOf(playerID);
      const cards = G.game.players[player].hand.slice();
      await this.hands[player].uiUpdate(cards);
    };

    driver.on("redraw", async (playerID) => {
      if (!active) return;
      const { G } = match.client.getState();
      await uiRedraw(G, playerID);
    });

    driver.on("round", (round) => {
      if (!active) return;
      const { G } = match.client.getState();
      if (round != 12) {
        gui.uiBlocking(async () => await uiUpdate(G));
      }
    });

    const exit = async () => {
      await gui.hide();
    };

    driver.on("finish", () => {
      if (!active) return;
      const { G } = match.client.getState();
      gui.uiBlocking(async () => {
        await uiUpdate(G);
        const li = G.game.board.count.area;
        const e = li[0] - li[1];
        const { matchData } = match.client;
        console.log(matchData);
        const [p1, p2] = G.meta.players.map((i) => matchData[+i].name);
        await AlertDialog.prompt({
          msg: e == 0 ? "Draw" : `${e > 0 ? p1 : p2} win`,
          cancelMsg: null,
        });
        await exit();
      });
    });

    driver.on("abort", async () => {
      if (!active) return;
      await AlertDialog.prompt({
        msg: "Match aborted",
        cancelMsg: null,
      });
      await exit();
    });
  }
}
