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

const logger = getLogger("player-panel");
logger.setLevel("info");

type Action = "discard" | "trivial" | "special";

interface MatchState {
  player: IPlayerId;
  handMask: boolean[];
  handSpMask: boolean[];
}

interface PlayerPanelProps {
  gui: GUI;
  enabled: boolean;
  selected: number;
  action: Action;
  state: MatchState;
}

export class PlayerPanel extends ReactComponent<PlayerPanelProps> {
  readonly hands = new Hands();
  readonly preview = new DeckPreview();

  private detach: any[] = [];

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
      this.props.gui.uiUpdateSlots(
        {
          card,
          discard: false,
          show: card >= 0,
          flip: true,
          preview: true,
        },
        this.props.gui.props.slots[1]
      );
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
              top: 215,
              borderRadius: 9999,
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              boxShadow: "2px 2px rgba(0, 0, 0, 0.4)",
              p: 3,
            }}
            onClick={() =>
              this.preview.update({ open: !this.preview.props.open })
            }
          >
            Deck
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
    const { gui } = this.props;

    let G0 = match.client.getState().G;
    let player: IPlayerId = -1 as IPlayerId;
    let players: IPlayerId[] = [];

    this.detach.forEach((f) => f());
    const driver = new MatchDriver(match);

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
      gui.board.position.set(194, -16);
      gui.board.update({ acceptInput: false });
      gui.board.uiUpdateOverlay(null);
      gui.szMeter.position.set(-315, 5);
      gui.szMeter.roots.forEach((e) => e.position.set(0, 0));
      gui.spCutInAnim.position.set(0, 0);
      await gui.update({
        visibility: { slots: true },
      });
      await gui.reset(G, players);
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
      players = [player, (1 - player) as IPlayerId];
      if (player < 0) return;
      gui.show(async () => await uiReset(G));
    });

    driver.on("move", (playerID) => {
      if (player < 0) return;
      gui.uiNonBlocking(async () => {
        const slots = gui.props.slots.slice();
        slots[+(playerID != match.playerID)] = {
          card: -1,
          discard: false,
          show: true,
          preview: false,
          flip: false,
        };
        await gui.update({ slots });
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

    const queryMovement = (G) => async () => {
      const move = await uiQueryPlayerMovement(G.game);
      if (move) {
        match.send("PlayerMove", move);
      }
    };

    const queryRedraw = (G: IMatchState) => async () => {
      const quota = G.buffer.redrawQuota[player];
      if (quota <= 0) {
        gui.uiNonBlocking(queryMovement(G));
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
        gui.uiNonBlocking(queryMovement(G));
      }
    };

    const uiUpdate = async (G: IMatchState) => {
      const cards = Array(4);
      const { hand } = G.buffer.history.slice(-1)[0][player];
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

    driver.on("redraw", async (playerID) => {
      if (player < 0) return;
      if (playerID == match.playerID) {
        const { G } = match.client.getState();
        gui.uiBlocking(async () => await uiRedraw(G));
        G0 = G;
        await queryRedraw(G)();
      }
    });

    driver.on("round", (round) => {
      if (player < 0) return;
      const { G } = match.client.getState();
      if (round != 12) {
        gui.uiBlocking(async () => {
          await gui.uiUpdate(G, G0, players, async () => await uiUpdate(G));
          G0 = G;
        });
      }
      if (round != 0) {
        gui.uiNonBlocking(round == 12 ? queryRedraw(G) : queryMovement(G));
      }
    });

    const exit = async () => {
      await gui.hide(async () => {
        this.send("cancel");
      });
    };

    driver.on("finish", () => {
      if (player < 0) return;
      const { G } = match.client.getState();
      gui.uiBlocking(async () => {
        await gui.uiUpdate(G, G0, players, async () => await uiUpdate(G));
        G0 = G;
        const li = G.game.board.count.area;
        const e = li[players[0]] - li[players[1]];
        await AlertDialog.prompt({
          msg: e == 0 ? "Draw" : `You ${e > 0 ? "win" : "lose"}`,
          cancelMsg: null,
        });
        await exit();
      });
    });

    driver.on("abort", async () => {
      if (player < 0) return;
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
