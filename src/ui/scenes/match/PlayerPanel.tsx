import { Box, Button, Paper } from "@mui/material";
import { ReactComponent } from "../../../engine/ReactComponent";
import { DarkButton } from "../../Theme";
import { Hands } from "./Hands";
import { useEffect, useMemo } from "react";
import {
  enumerateBoardMoves,
  getCardById,
  isGameMoveValid,
} from "../../../core/Tableturf";
import { GUI } from "./GUI";
import { Match } from "../../../game/Match";
import { MatchDriver } from "../../../game/MatchDriver";
import { AlertDialog } from "../../components/AlertDialog";
import { getLogger } from "loglevel";
import { MessageBar } from "../../components/MessageBar";
import { System } from "../../../engine/System";
import { DeckPreview } from "./DeckPreview";
import { MatchActivity } from "../../activities/MatchActivity";
import { ReplayListActivity } from "../../activities/ReplayListActivity";
import { CardSlot } from "./CardSlot";

const logger = getLogger("player-panel");
logger.setLevel("info");

interface MatchState {
  player: IPlayerId;
  handMask: boolean[];
  handSpMask: boolean[];
}

interface SlotState {
  card: number;
  discard: boolean;
  show: boolean;
  preview: boolean;
  flip: boolean;
}

interface PlayerPanelProps {
  gui: GUI;
  enabled: boolean;
  selected: number;
  action: "discard" | "trivial" | "special";
  state: MatchState;
  slots: SlotState[];
}

const emptySlots: SlotState[] = Array(2).fill({
  card: -1,
  discard: false,
  show: false,
  flip: false,
  preview: true,
});

export class PlayerPanel extends ReactComponent<PlayerPanelProps> {
  readonly hands = new Hands();
  readonly preview = new DeckPreview();

  private detach: any[] = [];
  private match: Match;

  constructor() {
    super();
    this.hands.on("selected-change", () => {
      this.update({ selected: this.hands.props.selected });
    });
  }

  init(): PlayerPanelProps {
    return {
      gui: null,
      enabled: true,
      selected: -1,
      action: "trivial",
      state: null,
      slots: emptySlots,
    };
  }

  render() {
    useEffect(() => {
      if (!this.props.enabled) {
        return;
      }
      const card =
        this.props.selected >= 0
          ? this.hands.props.cards[this.props.selected]
          : -1;
      if (this.props.action == "discard" && card >= 0) {
        return;
      }
      this.update({
        slots: [
          {
            card,
            discard: false,
            show: card >= 0,
            flip: true,
            preview: true,
          },
          this.props.slots[1],
        ],
      });
    }, [this.props.selected, this.props.enabled, this.props.action]);

    useEffect(() => {
      if (!this.props.state) {
        return;
      }
      let selected = this.hands.props.selected;
      let mask = this.props.state.handMask;
      if (this.props.action == "discard") {
        mask = Array(4).fill(true);
        selected = -1;
      }
      if (this.props.action == "special") {
        mask = this.props.state.handSpMask;
        if (!mask[selected]) {
          selected = -1;
        }
      }
      this.hands.update({ selected, mask });
    }, [this.props.action, this.props.state]);

    useEffect(() => {
      this.dispatchEvent("action-change", this.props.action);
    }, [this.props.action]);

    useEffect(() => {
      this.hands.update({
        enabled: this.props.enabled,
        selected: -1,
      });
    }, [this.props.enabled]);

    const btnPanel = useMemo(
      () => (
        <div>
          <DarkButton
            disabled={!this.props.enabled}
            selected={this.props.enabled && this.props.action == "discard"}
            sx={{
              position: "absolute",
              left: 42,
              top: 838,
              width: 220,
              height: 90,
              "&.Mui-selected": {
                backgroundColor: "#d2e332dd",
              },
              "&.Mui-selected:hover": {
                backgroundColor: "#d2e332ff",
              },
            }}
            onClick={() =>
              this.update({
                action: this.props.action != "discard" ? "discard" : "trivial",
              })
            }
          >
            Pass
          </DarkButton>
          <DarkButton
            disabled={!this.props.enabled}
            selected={this.props.enabled && this.props.action == "special"}
            sx={{
              position: "absolute",
              left: 292,
              top: 838,
              width: 220,
              height: 90,
              "&.Mui-selected": {
                backgroundColor: "#d2e332dd",
              },
              "&.Mui-selected:hover": {
                backgroundColor: "#d2e332ff",
              },
            }}
            onClick={() =>
              this.update({
                action: this.props.action != "special" ? "special" : "trivial",
              })
            }
          >
            Special Attack!
          </DarkButton>
          <Button
            sx={{
              position: "absolute",
              left: 570,
              top: 210,
              width: 180,
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              boxShadow: "2px 2px rgba(0, 0, 0, 0.4)",
              p: 1,
            }}
            onClick={async () => {
              const ok = await AlertDialog.prompt({
                msg: "Give up and lose the match?",
                okMsg: "OK",
                cancelMsg: "Not now",
              });
              if (ok) {
                this.match.send("GiveUp");
              }
            }}
          >
            Give Up
          </Button>
          <Button
            sx={{
              position: "absolute",
              left: 570,
              top: 292,
              width: 180,
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              boxShadow: "2px 2px rgba(0, 0, 0, 0.4)",
              p: 1,
            }}
            onClick={() =>
              this.preview.update({ open: !this.preview.props.open })
            }
          >
            Toggle Deck
          </Button>
        </div>
      ),
      [this.props.enabled, this.props.action]
    );

    return (
      <Box
        sx={{
          visibility:
            this.props.state && this.props.state.player >= 0
              ? "visible"
              : "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 315,
            left: 1585,
            pointerEvents: "none",
          }}
        >
          {this.props.slots.map(({ card, discard, show, flip, preview }, i) => (
            <div style={{ position: "absolute" }} key={i}>
              <CardSlot
                card={card}
                discard={discard}
                width={292}
                player={i as IPlayerId}
                dy={220 * (1 - 2 * i)}
                preview={preview}
                show={show}
                flip={flip}
              />
            </div>
          ))}
        </div>
        <Paper
          sx={{
            position: "absolute",
            left: 0,
            top: 135,
            width: 545,
            height: 675,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            boxShadow: "2px 2px rgba(0, 0, 0, 0.4)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              left: 28,
              top: 25,
              width: 510,
              height: 640,
            }}
          >
            {this.hands.node}
          </Box>
        </Paper>
        {btnPanel}
        <Box
          sx={{
            position: "absolute",
            left: -8,
            width: 0,
            height: 0,
          }}
        >
          {this.preview.node}
        </Box>
      </Box>
    );
  }

  bind(match: Match) {
    if (match == null) {
      this.update({ state: null });
      return;
    }

    const { gui } = this.props;

    let G0 = match.client.getState().G;
    let player: IPlayerId = -1 as IPlayerId;
    let players: IPlayerId[] = [];
    let playerNames: string[] = [];

    this.match = match;
    this.detach.forEach((f) => f());
    const driver = new MatchDriver(match);

    const sleep = (t: number) =>
      new Promise((resolve) => setTimeout(resolve, t * 1000));

    const uiUpdateMask = async (G: IMatchState) => {
      const { game } = G;
      const playerState = game.players[player];
      const cards = playerState.hand;
      const handMask = cards.map(
        (card) =>
          card && enumerateBoardMoves(game, player, card, false).length > 0
      );
      const handSpMask = cards.map(
        (card) =>
          card &&
          getCardById(card).count.special <= playerState.count.special &&
          enumerateBoardMoves(game, player, card, true).length > 0
      );
      await this.update({
        action: "trivial",
        state: {
          player,
          handMask,
          handSpMask,
        },
      });
    };

    const uiReset = async (G: IMatchState) => {
      gui.board.scale.set(1);
      gui.board.position.set(194, -16);
      gui.board.update({ acceptInput: false });
      gui.board.uiUpdateOverlay(null);
      gui.szMeter.position.set(-315, 5);
      gui.szMeter.position.set(-315, 65);
      gui.szMeter.roots.forEach((e) => e.position.set(0, 0));
      gui.spCutInAnim.position.set(0, 0);
      await this.update({ slots: emptySlots });
      await gui.reset(
        G.game,
        players.map((id) => ({ id, name: playerNames[id] }))
      );
      await uiUpdateMask(G);
      const playerState = G.game.players[player];
      const cards = playerState.hand;
      await this.hands.update({
        cards,
        selected: -1,
      });
      await this.preview.update({
        open: false,
        deck: MatchActivity.props.deck.deck.slice(),
        done: cards.slice(),
      });
      // give the browser 300ms to update layout
      await new Promise((resolve) => setTimeout(resolve, 300));
    };

    driver.on("start", () => {
      const { G } = match.client.getState();
      G0 = G;
      player = G.meta.players.indexOf(match.playerID) as IPlayerId;
      if (player < 0) return;
      players = [player, (1 - player) as IPlayerId];
      playerNames = G.meta.players.map((i) => match.client.matchData[+i].name);
      gui.show(async () => await uiReset(G));
    });

    driver.on("move", (playerID) => {
      if (player < 0) return;
      gui.uiNonBlocking(async () => {
        const slots = this.props.slots.slice();
        slots[+(playerID != match.playerID)] = {
          card: -1,
          discard: false,
          show: true,
          preview: false,
          flip: false,
        };
        await this.update({ slots });
      });
    });

    const uiQueryPlayerMovement = async (game: IGameState) => {
      await this.update({ enabled: true });

      const { board, szMeter } = gui;
      board.update({
        input: {
          ...board.props.input.value,
          rotation: (2 * player) as any,
          pointer: null,
        },
        acceptInput: true,
      });

      let move: IPlayerMovement;
      do {
        move = await Promise.race([
          this.receive("player.pass"),
          board.receive("player.input").then((input: ICardPlacement) => {
            const { rotation, position } = input;
            const move: IPlayerMovement = {
              // TODO: fix timing issues
              action: this.props.action,
              hand: this.hands.props.selected,
              player: player,
              params: {
                rotation,
                position,
              },
            };
            return move;
          }),
          this.receive("cancel").then(() => null),
        ]);
        // canceled
        if (move == null) {
          logger.warn("input canceled");
          break;
        }
        if (isGameMoveValid(game, move)) {
          break;
        }
        MessageBar.error("you can't put it there");
        logger.warn("invalid movement:", move);
      } while (1);

      board.update({ acceptInput: false });
      szMeter.update({ preview: false });
      await gui.panel.spMeter[0].update({ preview: -1 });
      await this.update({ enabled: false });

      return move;
    };

    const queryMovement = async (G) => {
      const move = await uiQueryPlayerMovement(G.game);
      if (move) {
        match.send("PlayerMove", move);
      }
    };

    const queryRedraw = async (G: IMatchState) => {
      const quota = G.buffer.redrawQuota[player];
      if (quota <= 0) {
        gui.uiNonBlocking(async () => await queryMovement(G));
        return;
      }
      const ok = await AlertDialog.prompt({
        msg: `Redraw hand? (${quota} left)`,
        okMsg: "Redraw",
        cancelMsg: "Cancel",
      });
      if (ok) {
        match.send("Redraw");
      } else {
        gui.uiNonBlocking(async () => await queryMovement(G));
      }
    };

    const uiUpdate = async (G: IMatchState) => {
      const cards = Array(4);
      const { hand } = G.buffer.prevMoves[player];
      const card = G.game.players[player].hand[hand];
      cards[hand] = card;
      await uiUpdateMask(G);
      await this.hands.uiUpdate(cards);
      await this.preview.update({ done: [...this.preview.props.done, card] });
    };

    const uiRedraw = async (G: IMatchState) => {
      const cards = G.game.players[player].hand.slice();
      await uiUpdateMask(G);
      await this.hands.uiUpdate(cards);
      await this.preview.update({ done: cards.slice() });
    };

    const uiShowCards = async (G: IMatchState) => {
      const moves = G.buffer.prevMoves;
      const cards = G.buffer.cards.slice(-1)[0];
      const slots = this.props.slots.map((_, i) => {
        return {
          card: cards[players[i]],
          discard: moves[players[i]].action == "discard",
          show: true,
          preview: false,
          flip: true,
        };
      });
      logger.log(slots);
      await this.update({ slots });
      await sleep(0.3);
    };

    const uiHideCards = async () => {
      await Promise.all([
        sleep(0.3),
        (async () => {
          const slots = this.props.slots.map(({ card, discard }) => ({
            card,
            discard,
            show: false,
            preview: false,
            flip: true,
          }));
          await this.update({ slots });
        })(),
      ]);
      await this.update({ slots: emptySlots });
    };

    driver.on("redraw", async (playerID) => {
      if (player < 0) return;
      if (playerID == match.playerID) {
        const { G } = match.client.getState();
        gui.uiBlocking(async () => await uiRedraw(G));
        G0 = G;
        await queryRedraw(G);
      }
    });

    driver.on("round", (round) => {
      if (player < 0) return;
      gui.panel.timeMeter.stop();
      gui.panel.timeMeter.update({ timeSec: -1 });
      const { G } = match.client.getState();
      if (round != 12) {
        gui.uiBlocking(async () => {
          await gui.uiUpdate(
            G.game,
            G0.game,
            G.buffer.prevMoves,
            G.buffer.cards.slice(-1)[0],
            players,
            {
              "2": async () => await uiShowCards(G),
              "3": async () => await uiHideCards(),
              "4": async () => await uiUpdate(G),
            }
          );
          G0 = G;
        });
      }
      gui.uiNonBlocking(async () => {
        if (G.meta.turnTimeQuotaSec > 0) {
          gui.panel.timeMeter.start(
            G.buffer.timestamp,
            G.meta.turnTimeQuotaSec
          );
        }
        if (round == 12) {
          await queryRedraw(G);
        } else {
          await queryMovement(G);
        }
      });
    });

    const exit = async () => {
      await gui.hide(async () => {
        this.send("cancel");
      });
    };

    driver.on("finish", (replay) => {
      if (player < 0) return;
      gui.panel.timeMeter.stop();
      gui.panel.timeMeter.update({ timeSec: -1 });
      const { G } = match.client.getState();
      gui.uiBlocking(async () => {
        const winnerID = G.meta.players[replay.winner];
        // normal finish
        let msg =
          winnerID == null
            ? "Draw"
            : `You ${winnerID == match.playerID ? "win" : "lose"}`;
        const { finishReason: reason } = replay;
        switch (reason) {
          case "normal":
            await gui.uiUpdate(
              G.game,
              G0.game,
              G.buffer.prevMoves,
              G.buffer.cards.slice(-1)[0],
              players,
              {
                "2": async () => await uiShowCards(G),
                "3": async () => await uiHideCards(),
                "4": async () => await uiUpdate(G),
              }
            );
            G0 = G;
            break;
          case "giveup":
          case "tle":
            if (winnerID == null) {
              console.assert(reason == "tle");
              msg = "Both players time out, draw";
            } else {
              const rivalName = playerNames[1 - player];
              if (winnerID == match.playerID) {
                // you win
                const what = reason == "giveup" ? "give up" : "time out";
                msg = `${rivalName} ${what}, you win`;
              } else {
                msg =
                  reason == "giveup"
                    ? "You give up"
                    : `You time out, ${rivalName} win`;
              }
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
      if (player < 0) return;
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

    this.detach.push(
      this.hands.on("click", (hand: number) => {
        if (player < 0) return;
        if (hand == this.hands.props.selected) {
          gui.board.uiRotateInput(1);
        }
      })
    );

    const uiUpdateInput = async () => {
      const { selected: hand } = this.hands.props;
      const { action } = this.props;
      if (action == "discard" && hand >= 0) {
        const move: IPlayerMovement = {
          player,
          action: "discard",
          hand,
        };
        this.send("player.pass", move);
      }
      const card =
        hand < 0 || action == "discard"
          ? null
          : getCardById(G0.game.players[player].hand[hand]);
      let pointer = gui.board.props.input.value.pointer;
      if (card != gui.board.props.input.value.card) {
        if (System.isMobile) {
          if (pointer == null) {
            const [w, h] = G0.game.board.size;
            pointer = { x: Math.floor(w / 2), y: Math.floor(h / 2) };
          }
        }
      }
      await gui.panel.spMeter[0].update({
        preview:
          action == "special" && card
            ? gui.panel.spMeter[0].props.count - card.count.special
            : -1,
      });
      gui.board.update({
        input: {
          ...gui.board.props.input.value,
          card,
          pointer,
          isSpecialAttack: action == "special",
        },
      });
    };

    this.detach.push(
      this.hands.on("selected-change", () => {
        if (player < 0) return;
        uiUpdateInput();
      })
    );

    this.detach.push(
      this.on("action-change", () => {
        if (player < 0) return;
        uiUpdateInput();
      })
    );
  }
}
