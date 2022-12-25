import { Sprite, Texture } from "pixi.js";
import { BoardComponent } from "./BoardComponent";
import { SpCutInAnimation } from "./SpCutInAnimation";
import { Window } from "../engine/Window";
import { ColorPalette } from "./ColorPalette";
import { Color } from "../engine/Color";
import { SzMeterComponent } from "./SzMeterComponent";
import { GamePlayCardComponent } from "./GamePlayCardComponent";
import { TurnMeterComponent } from "./TurnMeterComponent";
import { EaseFunc } from "../engine/animations/Ease";
import { SpMeterComponent } from "./SpMeterComponent";
import { System } from "../engine/System";
import { getLogger } from "loglevel";
import { enumerateBoardMoves } from "../core/Tableturf";
import { TableturfClientState, TableturfGameState } from "../Game";
import { getCardById, moveBoard, isGameMoveValid } from "../core/Tableturf";
import { MessageBar } from "./components/MessageBar";
import { ReactNode, useRef } from "react";
import { Box, Grid, Paper, ThemeProvider } from "@mui/material";
import { Theme, DarkButton } from "./Theme";
import { ReactComponent } from "../engine/ReactComponent";
import { Client } from "../client/Client";
import { CardSmall } from "./components/CardSmall";
import gsap from "gsap";
import { ActivityPanel } from "./Activity";

const logger = getLogger("game-play");
logger.setLevel("info");

type PartialMove = Omit<Omit<IPlayerMovement, "player">, "params">;

interface GamePlayState {
  player: IPlayerId;
  handMask: boolean[];
  handSpMask: boolean[];
}

interface GamePlayWindowUIProps {
  enable: boolean;
  cards: number[];
  mask: boolean[];
  selected: number;
  action: "discard" | "trivial" | "special";
  state: GamePlayState;
  onUpdateMove: (move: PartialMove) => void;
  onClick: (hand: number) => void;
}

class GamePlayWindowPanel extends ReactComponent<GamePlayWindowUIProps> {
  private cardsRef;

  init(): GamePlayWindowUIProps {
    return {
      enable: true,
      cards: [],
      mask: Array(4).fill(true),
      selected: -1,
      action: "trivial",
      state: null,
      onUpdateMove: () => {},
      onClick: () => {},
    };
  }

  async resetGameSate(player: IPlayerId, game: IGameState) {
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

  async uiUpdateGameState(G: TableturfGameState) {
    const { hand } =
      G.moveHistory[G.moveHistory.length - 1][this.props.state.player];
    const cards = this.props.cards.slice();
    console.assert(0 <= hand && hand < 4);
    cards[hand] = G.game.players[this.props.state.player].hand[hand];

    await gsap.to(this.cardsRef.current[hand], {
      duration: 0.3,
      scale: 0.9,
      opacity: 0,
    });

    await this.resetGameSate(this.props.state.player, G.game);
    await new Promise((resolve) => setTimeout(resolve, 50));

    await gsap.to(this.cardsRef.current[hand], {
      duration: 0.3,
      scale: 1,
      opacity: 1,
    });
  }

  render(): ReactNode {
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
      </ThemeProvider>
    );
  }
}

class GamePlayWindow_0 extends Window {
  public readonly board: BoardComponent;
  // private readonly hand: HandComponent;
  private readonly szMeter: SzMeterComponent;
  private readonly turnMeter: TurnMeterComponent;
  private readonly overlay: Sprite;
  private readonly spCutInAnim: SpCutInAnimation;
  private readonly card1: GamePlayCardComponent;
  private readonly card2: GamePlayCardComponent;
  private readonly spMeter1: SpMeterComponent;
  private readonly spMeter2: SpMeterComponent;
  private readonly panel: GamePlayWindowPanel;

  private client: Client;

  private game: IGameState;
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
    card: {
      x: 772,
      y: -27,
      p: [
        {
          x: 0,
          y: 300,
        },
        {
          x: 0,
          y: -300,
        },
      ],
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
        const { board } = this.game;
        const { count } = moveBoard(board, [e]);
        this.szMeter.update({
          preview: true,
          preview1: count.area[this.client.playerId],
          preview2: count.area[1 - this.client.playerId],
        });
      }
    });

    const cardRoot = this.addContainer({
      parent: root,
      x: this.layout.card.x,
      y: this.layout.card.y,
    });
    cardRoot.scale.set(0.85);
    [this.card1, this.card2] = this.layout.card.p.map((p) =>
      this.addComponent(new GamePlayCardComponent(), {
        parent: cardRoot,
        anchor: 0.5,
        x: p.x,
        y: p.y,
      })
    );
    this.card2.update({ turn: -1 });

    [this.spMeter1, this.spMeter2] = this.layout.spMeter.p.map((p) =>
      this.addComponent(new SpMeterComponent(), {
        parent: root,
        x: p.x,
        y: p.y,
      })
    );
    this.spMeter2.update({ turn: -1 });

    this.overlay = this.addSprite({
      parent: root,
      anchor: 0.5,
      width: this.layout.width,
      height: this.layout.height,
      tint: Color.BLACK,
      texture: Texture.WHITE,
      alpha: 0,
    });
    this.overlay.visible = false;

    this.turnMeter = this.addComponent(new TurnMeterComponent(), {
      parent: root,
      anchor: 0.5,
      x: this.layout.turnMeter.x,
      y: this.layout.turnMeter.y,
    });

    this.spCutInAnim = new SpCutInAnimation();
    this.spCutInAnim.scaleToFit(this.layout.width, this.layout.height);
    this.addChild(this.spCutInAnim);

    this.panel = new GamePlayWindowPanel();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.panel.update({
      onUpdateMove: (move) => {
        logger.log(move);
        this.move = move;
        const { hand, action } = move;
        if (action == "discard" && hand >= 0) {
          const move: IPlayerMovement = {
            player: this.client.playerId,
            action: "discard",
            hand: hand,
          };
          this.send("player.pass", move);
        }
        const card =
          hand < 0 || action == "discard"
            ? null
            : getCardById(this.game.players[this.client.playerId].hand[hand]);
        let pointer = this.board.props.input.value.pointer;
        if (card != this.board.props.input.value.card) {
          if (System.isMobile) {
            if (pointer == null) {
              const [w, h] = this.game.board.size;
              pointer = { x: Math.floor(w / 2), y: Math.floor(h / 2) };
            }
          }
          this.card1.update({ card });
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

  bind(client: Client) {
    this.client = client;
    this.client.on("update", this._handleUpdate.bind(this));
  }

  async uiReset(G: TableturfGameState) {
    const players = [this.client.playerId, 1 - this.client.playerId];

    this.card1.update({ card: null });
    this.card2.update({ card: null });

    // init board
    this.board.update({ playerId: this.client.playerId, acceptInput: false });
    this.board.uiReset(G.game.board);

    //init hand
    await this.panel.resetGameSate(this.client.playerId, G.game);

    // init counters
    const count = players.map((player) => G.game.players[player].count);
    this.szMeter.update({ value1: count[0].area, value2: count[1].area });
    this.spMeter1.update({ value: count[0].special });
    this.spMeter2.update({ value: count[1].special });
    this.turnMeter.update({ value: G.game.round });
  }

  private _handleUpdate(
    { G, ctx }: TableturfClientState,
    { G: G0, ctx: ctx0 }: TableturfClientState
  ) {
    this.game = G.game;

    const sleep = async (t: number) => this.addAnimation().play(t);
    const enter = (phase: string) =>
      ctx.phase == phase && ctx0.phase != ctx.phase;
    const players = [this.client.playerId, 1 - this.client.playerId];

    [this.spMeter1, this.spMeter2].forEach((e, i) => {
      const player = players[i];
      if (G.players[player]) {
        e.update({
          name: G.players[player].name,
        });
      }
    });

    [this.card1, this.card2].forEach((ui, i) => {
      const player = players[i];
      if (!!G.moves[player] && !G0.moves[player]) {
        this._uiThreadAppend(async () => {
          await ui.uiSelectCard(getCardById(G.moves[player].card));
        });
      }
    });

    // enter new round
    if (G.moveHistory.length == G0.moveHistory.length + 1) {
      const moves = G.moveHistory[G.moveHistory.length - 1];
      this._uiThreadAppend(async () => {
        const dt = 0.8;

        // play sp animations
        if (moves.some((e) => e.action == "special")) {
          await this.spCutInAnim.uiPlay(
            ...players.map((player) =>
              moves[player].action == "special"
                ? getCardById(moves[player].card)
                : null
            )
          );
          [this.spMeter1, this.spMeter2].forEach((ui, i) => {
            const player = players[i];
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            ui.uiUpdate(G.game.players[player].count.special);
          });
        }

        // show cards
        await Promise.all(
          [this.card1, this.card2].map((ui, i) => {
            const player = players[i];
            return ui.uiShowCard(
              getCardById(moves[player].card),
              // TODO: maybe special counts
              moves[player].action == "discard"
            );
          })
        );

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
        const count = players.map((player) => G.game.players[player].count);
        await sleep(dt);
        await Promise.all([
          this.szMeter.uiUpdate(count[0].area, count[1].area),
          this.spMeter1.uiUpdate(count[0].special),
          this.spMeter2.uiUpdate(count[1].special),
        ]);

        // game may terminate here
        if (ctx.phase != "game") {
          return;
        }

        // draw card
        await Promise.all([
          this.panel.uiUpdateGameState(G),
          this.card1.uiHideCard(),
          this.card2.uiHideCard(),
        ]);

        // round meter
        const alpha = 0.5;
        const a1 = this.addAnimation((t) => {
          this.overlay.alpha = EaseFunc.LINEAR.interpolate(0, alpha, t);
        });
        const a2 = this.addAnimation((t) => {
          this.overlay.alpha = EaseFunc.LINEAR.interpolate(alpha, 0, t);
        });

        this.overlay.visible = true;
        await Promise.all([
          a1
            .play(0.2)
            .then(() => this.addAnimation().play(1))
            .then(() => a2.play(0.2)),
          this.turnMeter.uiUpdate(G.game.round),
        ]);
        this.overlay.visible = false;
      });
    }

    // enter game || new round
    if (
      enter("game") ||
      (G.moveHistory.length == G0.moveHistory.length + 1 && G.game.round > 0)
    ) {
      this._uiThreadAppend(async () => {
        // will block state update
        const move = await this._queryMovement();
        if (move) {
          this.client.send("move", move);
        }
      });
    }

    // after match
    if (enter("prepare")) {
      this._uiThreadAppend(async () => {
        await ActivityPanel.show();
      });
    }
  }

  private async _queryMovement(): Promise<IPlayerMovement> {
    await this.panel.update({
      enable: true,
    });

    this.board.update({
      input: {
        ...this.board.props.input.value,
        rotation: (2 * this.client.playerId) as any,
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
            player: this.client.playerId,
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
      if (isGameMoveValid(this.game, move)) {
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

  private _uiThreadAppend(task: () => Promise<void>) {
    this.uiTask = this.uiTask.then(task);
  }
}

export const GamePlayWindow = new GamePlayWindow_0();
