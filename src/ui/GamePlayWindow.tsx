import { Sprite, Texture } from "pixi.js";
import { BoardComponent } from "./BoardComponent";
import { HandComponent } from "./HandComponent";
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
import { enumerateBoardMoves, GameState } from "../core/Tableturf";
import { TableturfClientState, TableturfGameState } from "../Game";
import {
  getCardById,
  moveBoard,
  isGameMoveValid,
  PlayerMovement,
  CardPlacement,
} from "../core/Tableturf";
import { MessageBar } from "./components/MessageBar";
import { ReactNode } from "react";
import { ThemeProvider } from "@mui/material";
import { Theme, DarkButton } from "./Theme";
import { Cell } from "../engine/Cell";
import { ReactComponent } from "../engine/ReactComponent";
import { Client } from "../net/Client";

const logger = getLogger("game-play");
logger.setLevel("debug");

interface GamePlayWindowUIProps {
  enable: boolean;
  spAttack: boolean;
  onPass: () => void;
  onToggleSpAttack: () => void;
}

class GamePlayWindowPanel extends ReactComponent<GamePlayWindowUIProps> {
  init(): GamePlayWindowUIProps {
    return {
      enable: true,
      spAttack: false,
      onPass: () => {},
      onToggleSpAttack: () => {},
    };
  }

  render(): ReactNode {
    return (
      <ThemeProvider theme={Theme}>
        <DarkButton
          disabled={!this.props.enable}
          sx={{
            position: "absolute",
            left: 42,
            top: 838,
            width: 220,
            height: 90,
          }}
          onClick={this.props.onPass}
        >
          Pass
        </DarkButton>
        <DarkButton
          disabled={!this.props.enable}
          selected={this.props.enable && this.props.spAttack}
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
          onClick={this.props.onToggleSpAttack}
        >
          Special Attack!
        </DarkButton>
      </ThemeProvider>
    );
  }
}

class GamePlayWindow_0 extends Window {
  public readonly board: BoardComponent;
  private readonly hand: HandComponent;
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
  private handId: number = -1;
  public spAttack: Cell<boolean>;

  private game: GameState;
  private _uiTask = new Promise<void>((resolve) => resolve());

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
      x: -320,
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
      x: -300,
      y: -350,
    },
    hand: {
      x: -683,
      y: -52,
      width: 600,
      height: 660,
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
          x: -910,
          y: -514,
        },
      ],
    },
  };

  constructor() {
    super({
      bgTint: ColorPalette.Main.bg.primary,
    });

    // const bgShader = this.addShader(BlendGlsl, {
    //   uColorPrimary: ColorPalette.GamePlay.bg.primary.rgb01,
    //   uColorSecondary: ColorPalette.GamePlay.bg.secondary.rgb01,
    // });

    // this.bg.texture = Texture.from("IngameBG.webp");
    // this.bg.filters = [bgShader];

    // const { state } = this.game;
    const root = this.addContainer({
      x: this.layout.width / 2,
      y: this.layout.height / 2,
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

    this.szMeter = this.addComponent(new SzMeterComponent(), {
      parent: root,
      x: this.layout.szMeter.x,
      y: this.layout.szMeter.y,
    });

    this.hand = this.addComponent(new HandComponent(), {
      parent: root,
      anchor: 0.5,
      x: this.layout.hand.x,
      y: this.layout.hand.y,
      scale: {
        width: this.layout.hand.width,
        height: this.layout.hand.height,
      },
    });
    this.hand.onSelectCard((handId) => {
      if (handId != -1 && this.handId == handId) {
        this.board.uiRotateInput(1);
        return;
      }
      // may be null
      const card =
        handId == -1
          ? null
          : getCardById(this.game.players[this.client.playerId].hand[handId]);
      this.handId = handId;
      if (this.spAttack.value) {
        this.spMeter1.update({ spAttack: card ? card.count.special : 0 });
      }
      const input: any = { handId, card };
      if (System.isMobile) {
        if (this.board.props.input.value.pointer == null) {
          const [w, h] = this.game.board.size;
          input.pointer = { x: Math.floor(w / 2), y: Math.floor(h / 2) };
        }
      }
      this.board.update({
        input: { ...this.board.props.input.value, ...input },
      });
      this.card1.update({ card });
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
    this.panel.update({
      enable: false,
      onPass: () => {
        if (this.handId < 0) {
          return;
        }
        const move: PlayerMovement = {
          player: this.client.playerId,
          action: "discard",
          hand: this.handId,
        };
        this.send("player.pass", move);
      },
      onToggleSpAttack: () => {
        this.spAttack.update(!this.spAttack.value);
      },
    });

    this.spAttack = Cell.of(false).onUpdate((ok) => {
      if (ok) {
        const player = this.game.players[this.client.playerId];
        const mask = player.hand.map(
          (card) => getCardById(card).count.special <= player.count.special
        );
        this.hand.uiUpdateFilter(mask);
        this.hand.uiUpdateSpFire(mask);
        if (this.handId >= 0) {
          this.spMeter1.update({
            spAttack: getCardById(player.hand[this.handId]).count.special,
          });
        }
      } else {
        this.hand.uiUpdateFilter();
        this.hand.uiUpdateSpFire();
        this.spMeter1.update({ spAttack: 0 });
      }
      this.board.update({
        input: {
          ...this.board.props.input.value,
          isSpecialAttack: ok,
        },
      });
      this.panel.update({ spAttack: ok });
    });
  }

  protected renderReact(): ReactNode {
    return this.panel.node;
  }

  bind(client: Client) {
    this.client = client;
    this.client.on("update", this._handleUpdate.bind(this));
  }

  uiReset(G: TableturfGameState) {
    const players = [this.client.playerId, 1 - this.client.playerId];

    this.card1.update({ card: null });
    this.card2.update({ card: null });

    // init board
    this.board.update({ playerId: this.client.playerId, acceptInput: false });
    this.board.uiReset(G.game.board);

    //init hand
    this.hand.update({
      cards: G.game.players[this.client.playerId].hand.map(getCardById),
    });

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

        // game may terminate here
        if (ctx.phase != "game") {
          return;
        }

        // update counters
        const count = players.map((player) => G.game.players[player].count);
        await sleep(dt);
        await Promise.all([
          this.szMeter.uiUpdate(count[0].area, count[1].area),
          this.spMeter1.uiUpdate(count[0].special),
          this.spMeter2.uiUpdate(count[1].special),
        ]);

        // draw card
        const { hand } = moves[this.client.playerId];
        await Promise.all([
          this.hand.uiDrawCard(
            getCardById(G.game.players[this.client.playerId].hand[hand]),
            hand
          ),
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
      this._uiTask.then(async () => {
        // will block state update
        const move = await this._queryMovement();
        if (move) {
          this.client.send("move", move);
        }
      });
    }
  }

  private _updateHandFilter() {
    this.hand.uiUpdateFilter(
      this.game.players[this.client.playerId].hand.map(
        (card) =>
          enumerateBoardMoves(
            this.game,
            this.client.playerId,
            card,
            !!this.spAttack.value
          ).length > 0
      )
    );
  }

  private async _queryMovement(): Promise<PlayerMovement> {
    this.panel.update({ enable: true });
    this._updateHandFilter();
    this.board.update({
      input: {
        card:
          this.handId >= 0
            ? getCardById(
                this.game.players[this.client.playerId].hand[this.handId]
              )
            : null,
        rotation: (2 * this.client.playerId) as any,
        pointer: null,
        isSpecialAttack: false,
      },
      acceptInput: true,
    });

    let move: PlayerMovement;
    do {
      move = await Promise.race([
        this.receive("player.pass"),
        this.board.receive("player.input").then((input: CardPlacement) => {
          const { isSpecialAttack } = this.board.props.input.value;
          const { rotation, position } = input;
          const move: PlayerMovement = {
            player: this.client.playerId,
            action: isSpecialAttack ? "special" : "trivial",
            hand: this.handId,
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
      console.log("invalid movement:", move);
    } while (1);

    this.board.update({ acceptInput: false });
    this.hand.uiUpdateFilter(Array(4).fill(false));
    this.szMeter.update({ preview: false });
    this.panel.update({ enable: false });

    return move;
  }

  private _uiThreadAppend(task: () => Promise<void>) {
    this._uiTask = this._uiTask.then(task);
  }
}

export const GamePlayWindow = new GamePlayWindow_0();
