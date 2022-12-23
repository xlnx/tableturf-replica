import { Window } from "../engine/Window";
import { BoardComponent } from "./BoardComponent";
import { ColorPalette } from "./ColorPalette";
import {
  BoardState,
  Card,
  CardPlacement,
  getCardById,
  initGame,
  isBoardMoveValid,
  moveBoard,
} from "../core/Tableturf";
import { ItemListComponent } from "./ItemListComponent";
import { SmallCardComponent } from "./SmallCardComponent";
import { Color } from "../engine/Color";
import { Texture } from "pixi.js";
import { MessageBar } from "./MessageBar";
import { Component } from "../engine/Component";
import { System } from "../engine/System";
import { DeckEditWindow } from "./DeckEditWindow";
import { Lobby } from "../Lobby";
import { DB } from "../Database";
import BgMotionGlsl from "./shaders/BgMotion.glsl?raw";
import { ReactNode } from "react";
import { ThemeProvider } from "@mui/material";
import { Theme, BasicButton } from "./Theme";

interface IRecordBarComponentProps {
  card: Card;
  inDeck: boolean;
}

class RecordBarComponent extends Component<IRecordBarComponentProps> {
  layout = {
    width: 342,
    height: 73,
    radius: 10,
  };

  constructor() {
    super({
      card: getCardById(1),
      inDeck: false,
    });

    const { height, width, radius } = this.layout;

    const bg = this.addGraphics()
      .beginFill(Color.WHITE.i32)
      .drawRoundedRect(0, 0, width, height, radius);

    const textRoot = this.addContainer({
      x: 10,
      y: 20,
    });

    const fontSize = height * 0.4;
    const text1 = this.addText({
      parent: textRoot,
      x: 2,
      y: 2,
      style: {
        fill: Color.BLACK.i32,
        fontFamily: "Splatoon2",
        fontSize,
      },
    });
    text1.alpha = 0.5;
    const text = this.addText({
      parent: textRoot,
      style: {
        fill: 0xeeeeee,
        fontFamily: "Splatoon2",
        fontSize,
      },
    });

    this.lock();

    this.props.card.onUpdate((card) => {
      text.text = card.name;
      text1.text = card.name;
      this.lock();
    });
    this.props.inDeck.onUpdate((ok) => {
      if (ok) {
        bg.tint = ColorPalette.Main.bg.primary.i32;
        bg.alpha = 0.8;
      } else {
        bg.tint = Color.BLACK.i32;
        bg.alpha = 0.4;
      }
      this.lock();
    });
  }
}

interface ITryOutWindowProps {
  acceptInput: boolean;
}

class TryOutWindow_0 extends Window<ITryOutWindowProps> {
  private readonly board: BoardComponent;
  private readonly cards: SmallCardComponent[] = [];
  private readonly deckView: ItemListComponent<SmallCardComponent>;
  private readonly records: RecordBarComponent[] = [];
  private readonly recordView: ItemListComponent<RecordBarComponent>;

  private card: SmallCardComponent;
  private state: BoardState;
  private stage: number = 1;
  private deck: number[] = DB.player.deck.slice();

  layout = {
    width: 1920,
    height: 1080,
    board: {
      x: 194,
      y: -16,
      width: 1e8,
      height: 1040,
    },
    deck: {
      x: -900,
      y: -450,
    },
    record: {
      x: 590,
      y: -480,
      width: 350,
      height: 690,
    },
    btn: {
      deckEdit: {
        x: 1650,
        y: 790,
        width: 220,
        height: 90,
      },
      reset: {
        x: 1650,
        y: 900,
        width: 220,
        height: 90,
      },
    },
  };

  constructor() {
    super({
      bgTint: ColorPalette.TryOut.bg.primary,
      acceptInput: true,
    });

    const root = this.addContainer({
      x: this.layout.width / 2,
      y: this.layout.height / 2,
    });

    const bgShader = this.addShader(BgMotionGlsl, {
      uColorFgPrimary: ColorPalette.TryOut.bg.primary.rgb01,
      uColorFgSecondary: ColorPalette.TryOut.bg.primary.rgb01,
      uColorBg: ColorPalette.TryOut.bg.secondary.rgb01,
      uPatternSampler: System.texture("ThunderPattern_02.webp"),
      uSpeed: 0.01,
      uAngle: -60,
      uScale: 1.5,
    });

    this.addSprite({
      anchor: 0.5,
      parent: root,
      texture: Texture.WHITE,
      width: this.layout.width,
      height: this.layout.height,
      filters: [bgShader],
    });

    // init board
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

    // init deck view
    for (let i = 0; i < 15; ++i) {
      const card = new SmallCardComponent().update({ card: getCardById(1) });
      card.interactions.onTap(() => {
        if (this.card != null) {
          this.card.interactions.selected.update(false);
        }
        if (this.card == card) {
          this.board.uiRotateInput(1);
          return;
        }
        this.board.update({
          input: {
            ...this.board.props.input.value,
            card: card.props.card.value,
          },
        });
        card.interactions.selected.update(true);
        this.card = card;
      });
      this.cards.push(card);
    }

    this.addGraphics({ parent: root })
      .beginFill(Color.fromHex(0x101010).i32)
      .drawRoundedRect(-940, -520, 560, 1030, 24);

    this.deckView = this.addComponent(
      new ItemListComponent<SmallCardComponent>({
        width: 460,
        height: 1080,
      }),
      {
        parent: root,
        x: this.layout.deck.x,
        y: this.layout.deck.y,
      }
    ).update({
      bg: {
        color: Color.BLACK,
        alpha: 0,
      },
      layout: {
        xlimit: 3,
        padding: {
          x: 10,
        },
        anchor: {
          x: 0.5,
        },
      },
    });

    // init record view
    this.recordView = this.addComponent(
      new ItemListComponent<RecordBarComponent>({
        width: this.layout.record.width,
        height: this.layout.record.height,
      }),
      {
        parent: root,
        x: this.layout.record.x,
        y: this.layout.record.y,
      }
    ).update({
      bg: {
        color: Color.BLACK,
        alpha: 0,
      },
      layout: {
        xlimit: 1,
        anchor: {
          x: 0.5,
        },
        padding: {
          x: 0,
          y: 11,
        },
      },
    });

    this.props.acceptInput.onUpdate((ok) => {
      this.board.update({
        input: {
          card: null,
          rotation: 0,
          pointer: null,
          isSpecialAttack: false,
        },
        acceptInput: ok,
      });
    });

    this._mainLoop();
  }

  renderReact(): ReactNode {
    const { deckEdit, reset } = this.layout.btn;
    return (
      <ThemeProvider theme={Theme}>
        <BasicButton
          sx={{
            position: "absolute",
            left: deckEdit.x,
            top: deckEdit.y,
            width: deckEdit.width,
            height: deckEdit.height,
          }}
          onClick={() => Lobby.togglePixiWindow(DeckEditWindow)}
        >
          Edit Deck
        </BasicButton>
        <BasicButton
          sx={{
            position: "absolute",
            left: reset.x,
            top: reset.y,
            width: reset.width,
            height: reset.height,
          }}
          onClick={() => this.uiReset(this.stage, this.deck)}
        >
          Reset
        </BasicButton>
      </ThemeProvider>
    );
  }

  uiReset(stage?: number, deck?: number[]) {
    if (stage != null) {
      this.stage = stage;
    }
    if (deck != null) {
      this.deck = deck.slice();
    }
    this.state = initGame(this.stage, [this.deck, this.deck]).board;
    this.deckView.update({
      items: deck.map((id, i) =>
        this.cards[i].update({ card: getCardById(id) })
      ),
    });
    this.recordView.update({ items: [] });
    this.cards.forEach((card) => card.interactions.disabled.update(false));
    this.board.uiReset(this.state);
    if (this.card) {
      this.card.interactions.selected.update(false);
      this.card = null;
    }
    this.board.update({
      input: {
        ...this.board.props.input.value,
        card: null,
      },
    });
  }

  private async addRecord(card: Card, inDeck: boolean) {
    const idx = this.recordView.props.items.value.length;
    while (this.records.length <= idx) {
      this.records.push(new RecordBarComponent());
    }
    this.records[idx].update({ card, inDeck });
    this.recordView.update({ items: this.records.slice(0, idx + 1) });
  }

  private async _mainLoop() {
    while (true) {
      const e: CardPlacement = await this.board.receive("player.input");
      if (!this.state) {
        continue;
      }
      const ok = isBoardMoveValid(this.state, e, false);
      if (!ok) {
        MessageBar.error("you can't put it here.");
        continue;
      }
      this.state = moveBoard(this.state, [e]);
      this.addRecord(getCardById(e.card), true);
      this.card.interactions.disabled.update(true);
      this.board.update({
        input: {
          ...this.board.props.input.value,
          card: null,
        },
      });
      await this.board.uiPlaceCards([e]);
      this.board.uiUpdateFire();
    }
  }
}

export const TryOutWindow = new TryOutWindow_0();
