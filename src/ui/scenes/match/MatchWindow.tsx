import { BoardComponent } from "../../BoardComponent";
import { SpCutInAnimation } from "../../SpCutInAnimation";
import { Window } from "../../../engine/Window";
import { ColorPalette } from "../../ColorPalette";
import { SzMeterComponent } from "../../SzMeterComponent";
import { TurnMeterComponent } from "../../TurnMeterComponent";
import { SpMeterComponent } from "../../SpMeterComponent";
import { System } from "../../../engine/System";
import { getLogger } from "loglevel";
import { enumerateBoardMoves } from "../../../core/Tableturf";
import {
  getCardById,
  moveBoard,
  isGameMoveValid,
} from "../../../core/Tableturf";
import { MessageBar } from "../../components/MessageBar";
import { ReactNode, useEffect, useRef } from "react";
import { Box, Grid, Paper, ThemeProvider } from "@mui/material";
import { Theme, DarkButton } from "../../Theme";
import { ReactComponent } from "../../../engine/ReactComponent";
import { CardSmall } from "../../components/CardSmall";
import { ActivityPanel } from "../../Activity";
import { AlertDialog } from "../../components/AlertDialog";
import { InkResetAnimation } from "../../InkResetAnimation";
import { EntryWindow } from "../entry/EntryWindow";
import { CardSlot } from "./CardSlot";
import gsap from "gsap";
import { Match } from "../../../game/Match";
import { ClientState } from "boardgame.io/dist/types/src/client/client";
import { MatchDriver } from "../../../game/MatchDriver";

const logger = getLogger("game-play");
logger.setLevel("info");

type PartialMove = Omit<Omit<IPlayerMovement, "player">, "params">;

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

const emptySlots: SlotState[] = Array(2).fill({
  card: -1,
  discard: false,
  show: false,
  flip: false,
  preview: true,
});

interface MatchWindowPanelProps {
  enable: boolean;
  cards: number[];
  mask: boolean[];
  selected: number;
  action: "discard" | "trivial" | "special";
  state: MatchState;
  slots: SlotState[];
  onUpdateMove: (move: PartialMove) => void;
  onClick: (hand: number) => void;
}

class MatchWindowPanel extends ReactComponent<MatchWindowPanelProps> {
  private cardsRef;

  init(): MatchWindowPanelProps {
    return {
      enable: true,
      cards: [],
      mask: Array(4).fill(true),
      selected: -1,
      action: "trivial",
      state: null,
      slots: emptySlots,
      onUpdateMove: () => {},
      onClick: () => {},
    };
  }

  async updateGameSate(player: IPlayerId, game: IGameState) {
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
    const action = "trivial";
    const selected = -1;
    await this.update({
      cards,
      mask: handMask,
      selected,
      action,
      state: {
        player,
        handMask,
        handSpMask,
      },
    });
    this.props.onUpdateMove({
      action,
      hand: selected,
    });
  }

  async uiUpdateHand(G: IMatchState, isRedraw: boolean) {
    const idxs = isRedraw
      ? [0, 1, 2, 3]
      : [G.buffer.history.slice(-1)[0][this.props.state.player].hand];
    await Promise.all(
      idxs.map((idx) =>
        gsap.to(this.cardsRef.current[idx], {
          duration: 0.3,
          scale: 0.9,
          opacity: 0,
        })
      )
    );

    await this.updateGameSate(this.props.state.player, G.game);
    await new Promise((resolve) => setTimeout(resolve, 50));

    await Promise.all(
      idxs.map((idx) =>
        gsap.to(this.cardsRef.current[idx], {
          duration: 0.3,
          scale: 1,
          opacity: 1,
        })
      )
    );
  }

  render(): ReactNode {
    useEffect(() => {
      if (this.props.enable) {
        const card =
          this.props.selected >= 0 ? this.props.cards[this.props.selected] : -1;
        if (this.props.action != "discard" || card < 0) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
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
        }
      }
    }, [this.props.selected, this.props.enable, this.props.action]);

    this.cardsRef = useRef([]);

    const handleHandClick = async (selected: number) => {
      if (selected >= 0) {
        this.props.onClick(selected);
      }
      if (selected != this.props.selected) {
        await this.update({ selected });
        this.props.onUpdateMove({
          action: this.props.action,
          hand: selected,
        });
      }
    };

    const handlePass = async () => {
      const discard = this.props.action != "discard";
      const action = discard ? "discard" : "trivial";
      const selected = discard ? -1 : this.props.selected;
      await this.update({
        action,
        selected,
        mask: discard ? Array(4).fill(true) : this.props.state.handMask,
      });
      this.props.onUpdateMove({
        action,
        hand: selected,
      });
    };

    const handleSpAttack = async () => {
      const special = this.props.action != "special";
      const action = special ? "special" : "trivial";
      let selected = this.props.selected;
      if (special) {
        if (!this.props.state.handSpMask[selected]) {
          selected = -1;
        }
      }
      await this.update({
        action,
        selected,
        mask: special ? this.props.state.handSpMask : this.props.state.handMask,
      });
      this.props.onUpdateMove({
        action,
        hand: selected,
      });
    };

    const li = [];
    for (let i = 0; i < 4; ++i) {
      const card = this.props.cards[i];
      li.push(
        <Grid item xs={6} key={i}>
          <Box ref={(el) => (this.cardsRef.current[i] = el)}>
            <CardSmall
              card={card || 1}
              width={235}
              active={this.props.mask[i] && this.props.enable}
              selected={this.props.selected == i}
              onClick={() => handleHandClick(i)}
            ></CardSmall>
          </Box>
        </Grid>
      );
    }

    return (
      <ThemeProvider theme={Theme}>
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
          <Grid
            container
            sx={{
              position: "absolute",
              left: 28,
              top: 25,
              width: 510,
              height: 640,
            }}
          >
            {li}
          </Grid>
        </Paper>
        <DarkButton
          disabled={!this.props.enable}
          selected={this.props.enable && this.props.action == "discard"}
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
          onClick={handlePass}
        >
          Pass
        </DarkButton>
        <DarkButton
          disabled={!this.props.enable}
          selected={this.props.enable && this.props.action == "special"}
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
          onClick={handleSpAttack}
        >
          Special Attack!
        </DarkButton>
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
      </ThemeProvider>
    );
  }
}

class MatchWindow_0 extends Window {
  public readonly board: BoardComponent;
  private readonly szMeter: SzMeterComponent;
  private readonly turnMeter: TurnMeterComponent;
  private readonly spCutInAnim: SpCutInAnimation;
  private readonly spMeter1: SpMeterComponent;
  private readonly spMeter2: SpMeterComponent;
  private readonly panel: MatchWindowPanel;

  private player: IPlayerId;
  private players: IPlayerId[];
  private match: Match;
  private driver: MatchDriver;

  // private game: IGameState;
  private uiTask = new Promise<void>((resolve) => resolve());

  private move: PartialMove;

  layout = {
    width: 1920,
    height: 1080,
    board: {
      x: 194,
      y: -16,
      width: 1e8,
      height: 1040,
    },
    szMeter: {
      x: -315,
      y: -5,
      inks: [
        {
          x: -18,
          y: 80,
          width: 360,
          scale: 1,
          angle: -25,
          alpha: 0.8,
          tint: ColorPalette.Player1.primary,
          img: "Ink_04.webp",
        },
        {
          x: 42,
          y: -120,
          width: 360,
          scale: -1,
          alpha: 0.8,
          tint: ColorPalette.Player2.primary,
          img: "Ink_02.webp",
        },
      ],
    },
    turnMeter: {
      x: -280,
      y: -350,
    },
    spMeter: {
      p: [
        {
          x: -910,
          y: 442,
        },
        {
          x: -790,
          y: -514,
        },
      ],
    },
  };

  constructor() {
    super({
      bgTint: ColorPalette.Main.bg.primary,
    });

    // TODO: fix motion bg
    const root = this.addContainer({
      x: this.layout.width / 2,
      y: this.layout.height / 2,
    });

    this.szMeter = this.addComponent(new SzMeterComponent(), {
      parent: root,
      x: this.layout.szMeter.x,
      y: this.layout.szMeter.y,
    });

    this.board = this.addComponent(new BoardComponent(), {
      parent: root,
      anchor: 0.5,
      x: this.layout.board.x,
      y: this.layout.board.y,
      scale: {
        width: this.layout.board.width,
        height: this.layout.board.height,
      },
    });
    this.board.onUpdateInput((e, ok) => {
      if (!ok) {
        this.szMeter.update({ preview: false });
      } else {
        const { G } = this.match.client.getState();
        const player = G.meta.players.indexOf(this.match.playerID);
        const { count } = moveBoard(G.game.board, [e]);
        this.szMeter.update({
          preview: true,
          preview1: count.area[player],
          preview2: count.area[1 - player],
        });
      }
    });

    [this.spMeter1, this.spMeter2] = this.layout.spMeter.p.map((p) =>
      this.addComponent(new SpMeterComponent(), {
        parent: root,
        x: p.x,
        y: p.y,
      })
    );
    this.spMeter2.update({ turn: -1 });

    this.turnMeter = this.addComponent(new TurnMeterComponent(), {
      parent: root,
      anchor: 0.5,
      x: this.layout.turnMeter.x,
      y: this.layout.turnMeter.y,
    });

    this.spCutInAnim = new SpCutInAnimation();
    this.spCutInAnim.scaleToFit(this.layout.width, this.layout.height);
    this.addChild(this.spCutInAnim);

    this.panel = new MatchWindowPanel();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.panel.update({
      onUpdateMove: (move) => {
        logger.log(move);
        this.move = move;
        const { G } = this.match.client.getState();
        const player = G.meta.players.indexOf(this.match.playerID) as IPlayerId;
        const { hand, action } = move;
        if (action == "discard" && hand >= 0) {
          const move: IPlayerMovement = {
            player,
            action: "discard",
            hand: hand,
          };
          this.send("player.pass", move);
        }
        const card =
          hand < 0 || action == "discard"
            ? null
            : getCardById(G.game.players[player].hand[hand]);
        let pointer = this.board.props.input.value.pointer;
        if (card != this.board.props.input.value.card) {
          if (System.isMobile) {
            if (pointer == null) {
              const [w, h] = G.game.board.size;
              pointer = { x: Math.floor(w / 2), y: Math.floor(h / 2) };
            }
          }
        }
        if (move.action == "special" && card) {
          this.spMeter1.update({ spAttack: card.count.special });
        } else {
          this.spMeter1.update({ spAttack: 0 });
        }
        this.board.update({
          input: {
            ...this.board.props.input.value,
            card,
            pointer,
            isSpecialAttack: action == "special",
          },
        });
      },
      onClick: (hand) => {
        if (hand == this.panel.props.selected) {
          this.board.uiRotateInput(1);
        }
      },
    });
  }

  protected renderReact(): ReactNode {
    return this.panel.node;
  }

  bind(match: Match) {
    this.match = match;
    this.driver = new MatchDriver(match);

    const sleep = (t: number) =>
      new Promise((resolve) => setTimeout(resolve, t * 1000));

    let G0 = this.match.client.getState().G;

    this.driver.on("start", () => {
      if (this.player < 0) return;
      const { G } = match.client.getState();
      G0 = G;
      this.player = G.meta.players.indexOf(match.playerID) as IPlayerId;
      this.players = [this.player, (1 - this.player) as IPlayerId];
      const reset = async () => {
        this.board.update({
          playerId: this.player,
          acceptInput: false,
        });
        this.board.uiReset(G.game.board);
        await this.panel.updateGameSate(this.player, G.game);
        await this.panel.update({ slots: emptySlots });
        const count = this.players.map((i) => G.game.players[i].count);
        this.szMeter.update({ value1: count[0].area, value2: count[1].area });
        this.spMeter1.update({ value: count[0].special });
        this.spMeter2.update({ value: count[1].special });
        this.turnMeter.update({ value: G.game.round });
      };
      this.uiThreadAppend(async () => {
        await InkResetAnimation.play(async () => {
          await ActivityPanel.hide();
          await reset();
          MatchWindow.show();
        });
      });
    });

    this.driver.on("move", (playerID) => {
      if (this.player < 0) return;
      this.uiTask.then(() => {
        const slots = this.panel.props.slots.slice();
        slots[+(playerID != match.playerID)] = {
          card: -1,
          discard: false,
          show: true,
          preview: false,
          flip: false,
        };
        return this.panel.update({ slots });
      });
    });

    const handleNewRound = async (
      round: number,
      { G }: ClientState<IMatchState>
    ) => {
      const dt = 0.8;
      const moves = G.buffer.history.slice(-1)[0];
      const cards = G.buffer.cards.slice(-1)[0];

      // play sp animations
      if (moves.some((e) => e.action == "special")) {
        await this.spCutInAnim.uiPlay(
          ...this.players.map((i) =>
            moves[i].action == "special" ? getCardById(cards[i]) : null
          )
        );
        [this.spMeter1, this.spMeter2].forEach((ui, i) => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          ui.uiUpdate(G.game.players[this.players[i]].count.special);
        });
      }

      // show cards
      let slots: SlotState[] = this.panel.props.slots.map((_, i) => {
        return {
          card: cards[this.players[i]],
          discard: moves[this.players[i]].action == "discard",
          show: true,
          preview: false,
          flip: true,
        };
      });
      logger.log(slots);
      await this.panel.update({ slots });
      await sleep(0.3);

      // put cards
      for (const li of G.game.prevMoves) {
        await sleep(dt);
        await this.board.uiPlaceCards(li);
      }

      // update sp fire
      if (
        G.game.board.count.special.some(
          (v, i) => v != G0.game.board.count.special[i]
        )
      ) {
        await sleep(dt);
        this.board.uiUpdateFire();
      }

      // update counters
      const count = this.players.map((i) => G.game.players[i].count);
      await sleep(dt);
      await Promise.all([
        this.szMeter.uiUpdate(count[0].area, count[1].area),
        this.spMeter1.uiUpdate(count[0].special),
        this.spMeter2.uiUpdate(count[1].special),
      ]);

      G0 = G;
      // game may terminate here
      if (round == 0) {
        return;
      }

      // draw card
      slots = slots.map(({ card, discard }) => ({
        card,
        discard,
        show: false,
        preview: false,
        flip: true,
      }));
      await this.panel.update({ slots });
      await Promise.all([
        this.panel.uiUpdateHand(G, false),
        this.turnMeter.uiUpdate(G.game.round),
        sleep(0.3),
      ]);
      await this.panel.update({ slots: emptySlots });
    };

    const queryMovement = (G) => async () => {
      const move = await this.queryMovement(G.game);
      if (move) {
        match.send("PlayerMove", move);
      }
    };

    const queryRedraw = (G: IMatchState) => async () => {
      const quota = G.buffer.redrawQuota[this.player];
      if (quota <= 0) {
        this.uiTask.then(queryMovement(G));
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
        this.uiTask.then(queryMovement(G));
      }
    };

    this.driver.on("redraw", async (playerID) => {
      if (this.player < 0) return;
      if (playerID == match.playerID) {
        const { G } = match.client.getState();
        this.uiThreadAppend(async () => await this.panel.uiUpdateHand(G, true));
        await queryRedraw(G)();
      }
    });

    this.driver.on("round", (round) => {
      if (this.player < 0) return;
      if (round != 12) {
        this.uiThreadAppend(
          async () => await handleNewRound(round, match.client.getState())
        );
      }
      if (round != 0) {
        const { G } = match.client.getState();
        this.uiTask.then(round == 12 ? queryRedraw(G) : queryMovement(G));
      }
    });

    const exit = async () => {
      if (this.ui.visible) {
        await InkResetAnimation.play(async () => {
          this.send("cancel");
          await ActivityPanel.show();
          EntryWindow.show();
        });
      } else {
        await ActivityPanel.show();
      }
    };

    this.driver.on("finish", () => {
      if (this.player < 0) return;
      const { G } = match.client.getState();
      this.uiThreadAppend(async () => {
        await handleNewRound(0, match.client.getState());
        const li = G.game.board.count.area;
        const e = li[this.players[0]] - li[this.players[1]];
        await AlertDialog.prompt({
          msg: e == 0 ? "Draw" : `You ${e > 0 ? "win" : "lose"}`,
          cancelMsg: null,
        });
        await exit();
      });
    });

    this.driver.on("abort", () => {
      if (this.player < 0) return;
      this.uiThreadAppend(async () => {
        await AlertDialog.prompt({
          msg: "Match aborted",
          cancelMsg: null,
        });
        await exit();
      });
    });
  }

  private async queryMovement(game: IGameState): Promise<IPlayerMovement> {
    await this.panel.update({
      enable: true,
    });

    this.board.update({
      input: {
        ...this.board.props.input.value,
        rotation: (2 * this.player) as any,
        pointer: null,
      },
      acceptInput: true,
    });

    let move: IPlayerMovement;
    do {
      move = await Promise.race([
        this.receive("player.pass"),
        this.board.receive("player.input").then((input: ICardPlacement) => {
          const { rotation, position } = input;
          const move: IPlayerMovement = {
            ...this.move,
            player: this.player,
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
      MessageBar.error("you can't put it here.");
      logger.warn("invalid movement:", move);
    } while (1);

    this.board.update({ acceptInput: false });
    this.spMeter1.update({ spAttack: 0 });
    this.szMeter.update({ preview: false });
    await this.panel.update({
      enable: false,
      mask: Array(4).fill(true),
      selected: -1,
    });

    return move;
  }

  private uiThreadAppend(task: () => Promise<void>) {
    this.uiTask = this.uiTask.then(task);
  }
}

export const MatchWindow = new MatchWindow_0();
