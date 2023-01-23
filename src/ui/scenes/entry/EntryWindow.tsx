import "./EntryWindow.less";

import { Window } from "../../../engine/Window";
import { BoardComponent } from "../../BoardComponent";
import { ColorPalette } from "../../ColorPalette";
import {
  getCardById,
  initGame,
  isBoardMoveValid,
  moveBoard,
} from "../../../core/Tableturf";
import { Color } from "../../../engine/Color";
import { Texture } from "pixi.js";
import { MessageBar } from "../../components/MessageBar";
import { System } from "../../../engine/System";
import { DB } from "../../../Database";
import BgMotionGlsl from "../../shaders/BgMotion.glsl?raw";
import React, { useEffect } from "react";
import {
  Box,
  Paper,
  List,
  ThemeProvider,
  Typography,
  styled,
} from "@mui/material";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { Theme, BasicButton } from "../../Theme";
import { ReactComponent } from "../../../engine/ReactComponent";
// import { StarterDeck } from "../../../Game";
import { getLogger } from "loglevel";
import { rectToString } from "../../../core/Utils";
import { CardVaultPanel } from "./CardVaultPanel";
import { DeckPanel } from "./DeckPanel";
import { DeckSaveDialog } from "./DeckSaveDialog";
import { I18n } from "../../../i18n/I18n";
import { DeckShareDialog } from "./DeckShareDialog";
import { StarterDeck } from "../../../game/MatchController";

const logger = getLogger("entry-window");
logger.setLevel("info");

function initBoard(stage: number): IBoardState {
  return initGame(stage, [StarterDeck, StarterDeck]).board;
}

interface HistoryRecord {
  card: number;
  isInDeck: boolean;
  prevState: IBoardState;
}

interface EntryWindowPanelProps {
  history: HistoryRecord[];
  state: IBoardState;
  stage: number;
  deck: number[];
}

class EntryWindowPanel extends ReactComponent<EntryWindowPanelProps> {
  constructor(private readonly window: EntryWindow_0) {
    super();
  }

  init(): EntryWindowPanelProps {
    const stage = 3;
    const db = DB.read();
    return {
      // ...
      stage,
      deck: db.decks[db.currDeck].deck.slice(),
      // ...
      history: [],
      state: initBoard(stage),
    };
  }

  async processMove(move: ICardPlacement) {
    let { state, history } = this.props;
    const ok = isBoardMoveValid(state, move, false);
    if (!ok) {
      logger.debug("invalid move:", rectToString(state), move);
      MessageBar.error("you can't put it there");
      return;
    }
    const { board } = this.window;
    board.update({
      input: {
        ...board.props.input.value,
        card: null,
      },
    });
    history = [
      ...history,
      {
        card: move.card,
        isInDeck: true,
        prevState: state,
      },
    ];
    state = moveBoard(state, [move]);
    await this.update({ state, history });
    // await this.selectCard(-1);
    // TODO: move gui into self
    await board.uiPlaceCards([move]);
    board.uiUpdateFire();
  }

  handleCardClick(card: number) {
    const { board } = this.window;
    if (card > 0 && DeckPanel.props.card == card) {
      board.uiRotateInput(1);
    }
    board.update({
      input: {
        ...board.props.input.value,
        card: card > 0 ? getCardById(card) : null,
      },
    });
  }

  async reset(props?: Partial<EntryWindowPanelProps>) {
    await this.update({ ...props });
    const { stage } = this.props;
    const state = initBoard(stage);
    await this.update({ state, history: [] });
    // TODO: move gui into self
    const { board } = this.window;
    board.uiReset(state);
  }

  async undo() {
    const history = this.props.history.slice();
    if (history.length == 0) {
      MessageBar.error("no further actions.");
      return;
    }
    const { prevState: state } = history.pop();
    await this.update({ history, state });
    // TODO: move gui into self
    const { board } = this.window;
    board.uiReset(state);
  }

  render(): React.ReactNode {
    const historyPanel = (
      <List
        sx={{
          position: "absolute",
          width: 350,
          maxHeight: 690,
          left: 1550,
          top: 16,
          overflow: "auto",
        }}
      >
        <TransitionGroup>
          {this.props.history
            .slice()
            .reverse()
            .map(({ card, isInDeck }) => (
              <CSSTransition
                timeout={200}
                classNames="entry-history-bar"
                key={card}
              >
                <Box sx={{ p: 1 }}>
                  <Paper
                    sx={{
                      height: 72,
                      p: 1,
                      boxSizing: "border-box",
                      boxShadow: "4px 4px 2px rgba(0, 0, 0, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: isInDeck
                        ? ColorPalette.Main.bg.primary.hexSharp
                        : Color.BLACK.hexSharp,
                    }}
                  >
                    <Typography sx={{ textShadow: "2px 2px black" }}>
                      {I18n.localize(
                        "CommonMsg/MiniGame/MiniGameCardName",
                        getCardById(card).name
                      )}
                    </Typography>
                  </Paper>
                </Box>
              </CSSTransition>
            ))}
        </TransitionGroup>
      </List>
    );

    useEffect(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      DeckPanel.update({
        onClickCard: this.handleCardClick.bind(this),
      });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.reset();
    }, []);

    useEffect(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      DeckPanel.update({
        excludeCards: this.props.history.map(({ card }) => card),
      });
    }, [this.props.history]);

    const MyBtn = styled(BasicButton)(() => ({
      position: "absolute",
      width: 220,
      height: 90,
    }));

    const y0 = 750;
    const h = 100;
    const btnPanel = (
      <React.Fragment>
        <MyBtn
          sx={{
            left: 1650,
            top: y0 + h * 0,
          }}
          onClick={async () => {
            await this.reset();
            await DeckPanel.edit();
          }}
        >
          Edit Deck
        </MyBtn>
        <MyBtn
          sx={{
            left: 1650,
            top: y0 + h * 1,
          }}
          onClick={() => this.reset()}
        >
          Reset
        </MyBtn>
        <MyBtn
          sx={{
            left: 1650,
            top: y0 + h * 2,
          }}
          onClick={() => this.undo()}
        >
          Undo
        </MyBtn>
      </React.Fragment>
    );

    return (
      <ThemeProvider theme={Theme}>
        {historyPanel}
        {btnPanel}
        {DeckPanel.node}
        {CardVaultPanel.node}
        {DeckSaveDialog.node}
        {DeckShareDialog.node}
      </ThemeProvider>
    );
  }
}

class EntryWindow_0 extends Window {
  readonly panel: EntryWindowPanel = new EntryWindowPanel(this);

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
  };

  constructor() {
    super({
      bgTint: ColorPalette.Entry.bg.primary,
    });

    const root = this.addContainer({
      x: this.layout.width / 2,
      y: this.layout.height / 2,
    });

    const bgShader = this.addShader(BgMotionGlsl, {
      uColorFgPrimary: ColorPalette.Entry.bg.primary.rgb01,
      uColorFgSecondary: ColorPalette.Entry.bg.primary.rgb01,
      uColorBg: ColorPalette.Entry.bg.secondary.rgb01,
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
    this.board.onInput((move) => this.panel.processMove(move));
  }

  renderReact(): React.ReactNode {
    return this.panel.node;
  }
}

export const EntryWindow = new EntryWindow_0();
