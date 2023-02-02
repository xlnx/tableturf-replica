import { Box, Button, Paper } from "@mui/material";
import { ReactComponent } from "../../../engine/ReactComponent";
import { Match } from "../../../game/Match";
import { MatchDriver } from "../../../game/MatchDriver";
import { AlertDialog } from "../../components/AlertDialog";
import { GUI } from "./GUI";
import { Hands } from "./Hands";
import { getCardById, moveBoard } from "../../../core/Tableturf";
import { DeckPreview } from "./DeckPreview";

interface SpectatorPanelProps {
  gui: GUI;
  active: boolean;
}

export class SpectatorPanel extends ReactComponent<SpectatorPanelProps> {
  readonly hands = [new Hands(), new Hands()];
  readonly preview = [new DeckPreview(), new DeckPreview()];
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
    this.preview.forEach((preview, i) => {
      preview.update({ player: i as IPlayerId });
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
        {this.preview.map((preview, i) => (
          <Box key={i}>
            <Button
              sx={{
                position: "absolute",
                left: 600 + i * 620,
                top: 960,
                borderRadius: 9999,
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                boxShadow: "2px 2px rgba(0, 0, 0, 0.4)",
                p: 3,
              }}
              onClick={() => preview.update({ open: !preview.props.open })}
            >
              Deck
            </Button>
            <Box
              sx={{
                position: "absolute",
                left: -8 + i * (1346 + 8),
                width: 0,
                height: 0,
              }}
            >
              {preview.node}
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
        G.game.players.map(async ({ hand, deck }, i) => {
          await this.hands[i].update({ cards: hand });
          await this.preview[i].update({
            open: false,
            deck: [...hand, ...deck],
            done: hand.slice(),
          });
          if (G.buffer.moves[i]) {
            await uiUpdatePlayerMove(G, G.buffer.moves[i]);
          }
        })
      );
      // give the browser 300ms to update layout
      await new Promise((resolve) => setTimeout(resolve, 300));
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
        const card = G.game.players[player].hand[hand];
        const e: ICardPlacement = {
          player,
          card,
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
        if (action == "special") {
          await gui.panel.spMeter[player].update({
            preview:
              G.game.players[player].count.special -
              getCardById(card).count.special +
              count.special[player] -
              G.game.board.count.special[player],
          });
        }
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
      gui.szMeter.update({ preview: false });
      await Promise.all(
        gui.panel.spMeter.map((meter, i) => meter.update({ preview: -1 }))
      );
      await gui.uiUpdate(G, G0, players, async () => {
        await Promise.all(
          [0, 1].map(async (i) => {
            const cards = Array(4);
            const { hand } = G.buffer.history.slice(-1)[0][i];
            const card = G.game.players[i].hand[hand];
            cards[hand] = card;
            await this.hands[i].update({ mask: Array(4).fill(true) });
            await this.hands[i].uiUpdate(cards);
            await this.preview[i].update({
              done: [...this.preview[i].props.done, card],
            });
          })
        );
      });
      G0 = G;
    };

    const uiRedraw = async (G: IMatchState, playerID: string) => {
      const player = G.meta.players.indexOf(playerID);
      const cards = G.game.players[player].hand.slice();
      await this.hands[player].uiUpdate(cards);
      await this.preview[player].update({ done: cards.slice() });
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

    driver.on("finish", (playerID, reason) => {
      if (!active) return;
      const { G } = match.client.getState();
      gui.uiBlocking(async () => {
        let msg =
          playerID == null
            ? "Draw"
            : `${match.client.matchData[playerID].name} win`;
        switch (reason) {
          case "normal":
            await uiUpdate(G);
            break;
          case "giveup":
          case "tle":
            if (playerID == null) {
              console.assert(reason == "tle");
              msg = "Both players time out, draw";
            } else {
              const name = match.client.matchData[playerID].name;
              const other = G.meta.players.find((e) => e != playerID);
              const otherName = match.client.matchData[other].name;
              const what = reason == "giveup" ? "give up" : "time out";
              msg = `${otherName} ${what}, ${name} win`;
            }
            break;
          default:
            console.error(`invalid reason: ${reason}`);
        }
        await AlertDialog.prompt({
          msg,
          cancelMsg: null,
        });
        await exit();
      });
    });

    driver.on("abort", async () => {
      if (!active) return;
      gui.uiBlocking(async () => {
        await AlertDialog.prompt({
          msg: "Match aborted",
          cancelMsg: null,
        });
        await exit();
      });
    });
  }
}
