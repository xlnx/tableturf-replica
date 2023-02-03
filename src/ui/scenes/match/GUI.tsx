import { getLogger } from "loglevel";
import { getCardById, moveBoard } from "../../../core/Tableturf";
import { ReactComponent } from "../../../engine/ReactComponent";
import { Window } from "../../../engine/Window";
import { Match } from "../../../game/Match";
import { BoardComponent } from "../../BoardComponent";
import { ColorPalette } from "../../ColorPalette";
import { SpCutInAnimation } from "../../SpCutInAnimation";
import { SzMeterComponent } from "../../SzMeterComponent";
import { CardSlot } from "./CardSlot";
import { ReactNode } from "react";
import { InkResetAnimation } from "../../InkResetAnimation";
import { ActivityPanel } from "../../Activity";
import { MatchWindow } from "./MatchWindow";
import { EntryWindow } from "../entry/EntryWindow";
import { SpMeter } from "./SpMeter";
import { Box } from "@mui/material";
import { TurnMeter } from "./TurnMeter";
import { TimeMeter } from "./TimeMeter";

const logger = getLogger("gui");
logger.setLevel("info");

interface SlotState {
  card: number;
  discard: boolean;
  show: boolean;
  preview: boolean;
  flip: boolean;
}

interface GUIResetOptions {
  flipCards?: boolean;
}

interface GUIPanelProps {
  G: IMatchState;
  player: IPlayerId;
  slots: SlotState[];
  visibility: {
    slots: boolean;
  };
}

const emptySlot = {
  card: -1,
  discard: false,
  show: false,
  flip: false,
  preview: true,
};

class GUIPanel extends ReactComponent<GUIPanelProps> {
  readonly spMeter = [new SpMeter(), new SpMeter()];
  readonly turnMeter = new TurnMeter();
  readonly timeMeter = new TimeMeter();

  init(): GUIPanelProps {
    return {
      G: null,
      player: 0,
      slots: [emptySlot, emptySlot],
      visibility: {
        slots: true,
      },
    };
  }

  constructor() {
    super();
    this.spMeter.forEach((meter, i) =>
      meter.update({ player: i as IPlayerId, flip: !!i })
    );
  }

  render() {
    return (
      <div>
        <div
          style={{
            position: "absolute",
            top: 315,
            left: 1585,
            pointerEvents: "none",
            visibility: this.props.visibility.slots ? "visible" : "hidden",
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
        <Box
          sx={{
            position: "absolute",
            left: 570,
            top: 32,
          }}
        >
          {this.turnMeter.node}
        </Box>
        <Box
          sx={{
            position: "absolute",
            left: 365,
            top: 32,
          }}
        >
          {this.timeMeter.node}
        </Box>
        {this.spMeter.map((e, i) => (
          <Box
            key={i}
            sx={{ position: "absolute", left: 24 + i * 1860, top: 970 }}
          >
            {e.node}
          </Box>
        ))}
      </div>
    );
  }
}

export class GUI {
  match: Match;

  readonly board: BoardComponent;
  readonly szMeter: SzMeterComponent;
  readonly spCutInAnim: SpCutInAnimation;

  readonly panel = new GUIPanel();

  private uiTask = new Promise<void>((resolve) => resolve());

  readonly layout = {
    width: 1920,
    height: 1080,
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
  };

  constructor(window: Window) {
    const root = window.addContainer({
      x: this.layout.width / 2,
      y: this.layout.height / 2,
    });

    this.szMeter = window.addComponent(new SzMeterComponent(), {
      parent: root,
      x: this.layout.szMeter.x,
      y: this.layout.szMeter.y,
    });

    this.board = window.addComponent(new BoardComponent(), {
      parent: root,
      anchor: 0.5,
      scale: {
        width: 1e8,
        height: 1040,
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

    this.spCutInAnim = new SpCutInAnimation();
    this.spCutInAnim.scaleToFit(this.layout.width, this.layout.height);
    window.addChild(this.spCutInAnim);
  }

  render(): ReactNode {
    return this.panel.node;
  }

  get props(): GUIPanelProps {
    return this.panel.props;
  }

  async update(props: Partial<GUIPanelProps>) {
    await this.panel.update(props);
  }

  uiBlocking(task: () => Promise<void>) {
    this.uiTask = this.uiTask.then(task);
  }

  uiNonBlocking(task: () => Promise<void>) {
    this.uiTask.then(task);
  }

  uiUpdateSlots(s1?: SlotState, s2?: SlotState) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.update({ slots: [s1 || emptySlot, s2 || emptySlot] });
  }

  async uiUpdate(
    G: IMatchState,
    G0: IMatchState,
    players: IPlayerId[],
    task: () => Promise<void> = async () => {}
  ) {
    const sleep = (t: number) =>
      new Promise((resolve) => setTimeout(resolve, t * 1000));

    const dt = 0.8;
    const moves = G.buffer.history.slice(-1)[0];
    const cards = G.buffer.cards.slice(-1)[0];

    // play sp animations
    if (moves.some((e) => e.action == "special")) {
      await this.spCutInAnim.uiPlay(
        ...players.map((i) =>
          moves[i].action == "special" ? getCardById(cards[i]) : null
        )
      );
      await Promise.all(
        this.panel.spMeter.map(async (meter, i) => {
          await meter.update({
            preview: -1,
            count: G.game.players[players[i]].count.special,
          });
        })
      );
    }

    // show cards
    let slots = this.props.slots.map((_, i) => {
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
    const count = players.map((i) => G.game.players[i].count);
    await sleep(dt);
    await Promise.all([
      this.szMeter.uiUpdate(count[0].area, count[1].area),
      this.panel.spMeter[0].update({ preview: -1, count: count[0].special }),
      this.panel.spMeter[1].update({ preview: -1, count: count[1].special }),
    ]);

    // game may terminate here
    if (G.game.round == 0) {
      return;
    }

    // prepare for next round
    slots = slots.map(({ card, discard }) => ({
      card,
      discard,
      show: false,
      preview: false,
      flip: true,
    }));
    await this.update({ slots });
    await Promise.all([
      task(),
      this.panel.turnMeter.uiUpdate(G.game.round),
      sleep(0.3),
    ]);
    this.uiUpdateSlots();
  }

  async reset(
    G: IMatchState,
    players: IPlayerId[],
    { flipCards = false }: GUIResetOptions = {}
  ) {
    this.board.update({
      playerId: players[0],
      acceptInput: false,
    });
    this.board.uiReset(G.game.board);
    const [s1, s2] = G.buffer.moves.map((move, i) => {
      if (move == null) {
        return null;
      }
      const { hand, action } = move;
      return {
        card: G.game.players[i].hand[hand],
        discard: action == "discard",
        show: flipCards,
        preview: false,
        flip: flipCards,
      };
    });
    this.uiUpdateSlots(s1, s2);
    const count = players.map((i) => G.game.players[i].count);
    this.szMeter.update({
      value1: count[0].area,
      value2: count[1].area,
    });
    await Promise.all(
      this.panel.spMeter.map((meter, i) =>
        meter.update({
          name: this.match.client.matchData[G.meta.players[players[i]]].name,
          preview: -1,
          count: count[i].special,
        })
      )
    );
    this.panel.turnMeter.update({ count: G.game.round });
  }

  async show(task: () => Promise<void> = async () => {}) {
    this.uiBlocking(async () => {
      await InkResetAnimation.play(async () => {
        await ActivityPanel.hide();
        await task();
        MatchWindow.show();
      });
    });
  }

  async hide(task: () => Promise<void> = async () => {}) {
    if (MatchWindow.ui.visible) {
      await InkResetAnimation.play(async () => {
        task();
        await ActivityPanel.show();
        EntryWindow.show();
      });
    } else {
      await ActivityPanel.show();
    }
  }
}
