import { Box, Button, Paper } from "@mui/material";
import { ReactComponent } from "../../../engine/ReactComponent";
import { Match } from "../../../game/Match";
import { MatchDriver } from "../../../game/MatchDriver";
import { AlertDialog } from "../../components/AlertDialog";
import { GUI } from "./GUI";
import { Hands } from "./Hands";
import { getCardById, moveBoard } from "../../../core/Tableturf";
import { DeckPreview } from "./DeckPreview";
import { getLogger } from "loglevel";
import { ReplayListActivity } from "../../activities/ReplayListActivity";

const logger = getLogger("spectator-panel");
logger.setLevel("info");

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
    if (match == null) {
      this.update({ active: false });
      return;
    }

    const { gui } = this.props;

    let G0 = match.client.getState().G;
    const players: IPlayerId[] = [0, 1];
    let playerNames: string[] = [];
    let active = false;

    this.detach.forEach((f) => f());
    const driver = new MatchDriver(match);

    const uiReset = async (G: IMatchState) => {
      gui.board.scale.set(1);
      gui.board.position.set(8, -16);
      gui.board.update({ acceptInput: false });
      gui.board.uiUpdateOverlay(null);
      gui.szMeter.position.set(-500, 300);
      gui.szMeter.roots[1].position.set(980, 190);
      gui.spCutInAnim.position.set(-86, 0);
      await gui.reset(
        G.game,
        players.map((id) => ({ id, name: playerNames[id] }))
      );
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
      playerNames = players.map(
        (i) => match.client.matchData[G.meta.players[i]].name
      );
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
      await gui.uiUpdate(
        G.game,
        G0.game,
        G.buffer.prevMoves,
        G.buffer.cards.slice(-1)[0],
        players,
        {
          "4": async () => {
            await Promise.all(
              [0, 1].map(async (i) => {
                const cards = Array(4);
                const { hand } = G.buffer.prevMoves[i];
                const card = G.game.players[i].hand[hand];
                cards[hand] = card;
                await this.hands[i].update({ mask: Array(4).fill(true) });
                await this.hands[i].uiUpdate(cards);
                await this.preview[i].update({
                  done: [...this.preview[i].props.done, card],
                });
              })
            );
          },
        }
      );
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
      gui.panel.timeMeter.stop();
      gui.panel.timeMeter.update({ timeSec: -1 });
      const { G } = match.client.getState();
      if (round != 12) {
        gui.uiBlocking(async () => await uiUpdate(G));
      }
      gui.uiNonBlocking(async () => {
        if (G.meta.turnTimeQuotaSec > 0) {
          gui.panel.timeMeter.start(
            G.buffer.timestamp,
            G.meta.turnTimeQuotaSec
          );
        }
      });
    });

    const exit = async () => {
      await gui.hide();
    };

    driver.on("finish", (replay) => {
      if (!active) return;
      gui.panel.timeMeter.stop();
      gui.panel.timeMeter.update({ timeSec: -1 });
      const { G } = match.client.getState();
      gui.uiBlocking(async () => {
        const winnerID = G.meta.players[replay.winner];
        let msg =
          winnerID == null ? "Draw" : `${playerNames[replay.winner]} win`;
        const { finishReason: reason } = replay;
        switch (reason) {
          case "normal":
            await uiUpdate(G);
            break;
          case "giveup":
          case "tle":
            if (winnerID == null) {
              console.assert(reason == "tle");
              msg = "Both players time out, draw";
            } else {
              const what = reason == "giveup" ? "give up" : "time out";
              msg = `${playerNames[1 - replay.winner]} ${what}, ${
                playerNames[replay.winner]
              } win`;
            }
            break;
          default:
            console.error(`invalid reason: ${reason}`);
        }
        await AlertDialog.prompt({
          msg,
          cancelMsg: null,
        });
        ReplayListActivity.addReplay({ ...replay, players: playerNames });
        await exit();
      });
    });

    driver.on("abort", async () => {
      if (!active) return;
      gui.panel.timeMeter.stop();
      gui.panel.timeMeter.update({ timeSec: -1 });
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
