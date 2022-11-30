import { Window } from "../engine/Window";
import { BoardComponent } from "./BoardComponent";
import { ColorPalette } from "./ColorPalette";
import {
  BoardState,
  CardPlacement,
  getCardById,
  initGame,
  isBoardMoveValid,
  moveBoard,
} from "../core/Tableturf";
import { Color } from "../engine/Color";
import { Texture } from "pixi.js";
import { MessageBar } from "./MessageBar";
import { Component } from "../engine/Component";
import { System } from "../engine/System";
import { DeckEditWindow } from "./DeckEditWindow";
import { Lobby } from "../Lobby";
import { DB } from "../Database";
import BgMotionGlsl from "./shaders/BgMotion.glsl?raw";
import React from "react";
import { Box, Card, Grid, List, ThemeProvider } from "@mui/material";
import { Theme, BasicButton } from "./Theme";
import { CardSmall } from "./components/CardSmall";
import { ReactComponent } from "../engine/ReactComponent";
import { StarterDeck } from "../Game";
import { getLogger } from "loglevel";
import { MatrixUtil } from "../core/Utils";

const logger = getLogger("try-out-window");
logger.setLevel("debug");

function initBoard(stage: number): BoardState {
  return initGame(stage, [StarterDeck, StarterDeck]).board;
}

interface IRecordBarComponentProps {
  card: number;
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
      card: 1,
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
      const { name } = getCardById(card);
      text.text = name;
      text1.text = name;
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

interface TryOutWindowPanelProps {
  // config
  stage: number;
  deck: number[];
  // state
  selectedCard: number;
  placed: Set<number>;
  state: BoardState;
}

class TryOutWindowPanel extends ReactComponent<TryOutWindowPanelProps> {
  private readonly layout = {
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
  };

  constructor(private readonly window: TryOutWindow_0) {
    super();
  }

  init(): TryOutWindowPanelProps {
    this.window.board.onInput((move) => this.processMove(move));
    const stage = 3;
    return {
      stage,
      deck: DB.player.deck.slice(),
      placed: new Set(),
      selectedCard: -1,
      state: initBoard(stage),
    };
  }

  async processMove(move: CardPlacement) {
    let { state, placed } = this.props;
    const ok = isBoardMoveValid(state, move, false);
    if (!ok) {
      logger.debug("invalid move:", MatrixUtil.print(state), move);
      MessageBar.error("you can't put it there.");
      return;
    }
    const { board } = this.window;
    board.update({
      input: {
        ...board.props.input.value,
        card: null,
      },
    });
    state = moveBoard(state, [move]);
    placed.add(move.card);
    await this.update({ state, placed });
    await this.selectCard(-1);
    // TODO: move gui into self
    await board.uiPlaceCards([move]);
    board.uiUpdateFire();
  }

  async selectCard(card: number) {
    const { selectedCard } = this.props;
    const { board } = this.window;
    if (card > 0 && selectedCard == card) {
      board.uiRotateInput(1);
    }
    board.update({
      input: {
        ...board.props.input.value,
        card: card > 0 ? getCardById(card) : null,
      },
    });
    await this.update({ selectedCard: card });
  }

  async reset() {
    const { stage, placed } = this.props;
    placed.clear();
    const state = initBoard(stage);
    await this.update({ state, placed });
    // TODO: move gui into self
    const { board } = this.window;
    board.uiReset(state);
  }

  componentDidMount(): void {
    this.reset();
  }

  render(): React.ReactNode {
    const { deckEdit, reset } = this.layout;
    return (
      <ThemeProvider theme={Theme}>
        <Card
          sx={{
            position: "absolute",
            width: 520,
            height: 1000,
            left: 30,
            top: 40,
            p: 3,
            boxSizing: "border-box",
            boxShadow: "5px 5px 2px rgba(0, 0, 0, 0.3)",
          }}
        >
          <List>
            <Grid container>
              {this.props.deck.map((card) => (
                <Grid key={card} item xs={4}>
                  <Box sx={{ p: 1 }}>
                    <CardSmall
                      active={!this.props.placed.has(card)}
                      width={136}
                      card={card}
                      selected={this.props.selectedCard == card}
                      onClick={() => this.selectCard(card)}
                    ></CardSmall>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </List>
        </Card>
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
          onClick={() => this.reset()}
        >
          Reset
        </BasicButton>
      </ThemeProvider>
    );
  }
}

class TryOutWindow_0 extends Window {
  readonly panel: TryOutWindowPanel = new TryOutWindowPanel(this);

  readonly board: BoardComponent;

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
  };

  constructor() {
    super({
      bgTint: ColorPalette.TryOut.bg.primary,
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
    }).update({
      input: {
        card: null,
        rotation: 0,
        pointer: null,
        isSpecialAttack: false,
      },
      acceptInput: true,
    });
  }

  renderReact(): React.ReactNode {
    return this.panel.node;
  }

  // private async addRecord(card: number, inDeck: boolean) {
  //   const idx = this.recordView.props.items.value.length;
  //   while (this.records.length <= idx) {
  //     this.records.push(new RecordBarComponent());
  //   }
  //   this.records[idx].update({ card, inDeck });
  //   this.recordView.update({ items: this.records.slice(0, idx + 1) });
  // }
}

export const TryOutWindow = new TryOutWindow_0();
