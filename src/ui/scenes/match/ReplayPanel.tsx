import { initGame, isGameMoveValid, moveGame } from "../../../core/Tableturf";
import { ReactComponent } from "../../../engine/ReactComponent";
import { Box, Button, Grid, Paper, IconButton, Tooltip } from "@mui/material";
import { GUI } from "./GUI";
import { Hands } from "./Hands";
import { MessageBar } from "../../components/MessageBar";
import { DeckPreview } from "./DeckPreview";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";

interface ReplayPanelProps {
  gui: GUI;
  replay: IMatchReplay;
  states: IGameState[];
  pos: number;
  playing: boolean;
  pausing: boolean;
}

export class ReplayPanel extends ReactComponent<ReplayPanelProps> {
  readonly hands = [new Hands(), new Hands()];
  readonly preview = [new DeckPreview(), new DeckPreview()];

  constructor() {
    super();
    this.hands.forEach((hands, i) => {
      hands.update({ player: i as IPlayerId });
    });
    this.preview.forEach((preview, i) => {
      preview.update({ player: i as IPlayerId });
    });
  }

  init(): ReplayPanelProps {
    return {
      gui: null,
      replay: null,
      states: [],
      pos: 0,
      playing: false,
      pausing: false,
    };
  }

  private async uiReset(pos: number) {
    const { gui, replay, states } = this.props;
    const game = states[pos];
    await this.update({ pos });
    await gui.reset(
      game,
      replay.players.map((name, i) => ({ id: i as IPlayerId, name }))
    );
    await Promise.all(
      game.players.map(async ({ hand, deck }, i) => {
        if (hand.some((e) => e == null)) {
          return;
        }
        await this.hands[i].update({ cards: hand });
        await this.preview[i].update({
          done: this.preview[i].props.deck.filter((e) => !deck.includes(e)),
        });
      })
    );
  }

  render() {
    const play = async () => {
      const { gui, states, pos, replay, playing, pausing } = this.props;
      if (pausing || pos + 1 >= states.length) {
        await this.update({ playing: false, pausing: false });
        return;
      }
      await this.update({ playing: true, pos: pos + 1 });
      const game0 = states[pos];
      const game = states[pos + 1];
      const moves = replay.moves[pos];
      gui.uiBlocking(async () => {
        await gui.uiUpdate(
          game,
          game0,
          moves,
          moves.map(({ hand }, i) => game0.players[i].hand[hand]),
          [0, 1],
          {
            "4": async () => {
              if (game.round == 0) {
                return;
              }
              await Promise.all(
                [0, 1].map(async (i) => {
                  const cards = Array(4);
                  const { hand } = moves[i];
                  const card = game.players[i].hand[hand];
                  cards[hand] = card;
                  await this.hands[i].update({ mask: Array(4).fill(true) });
                  await this.hands[i].uiUpdate(cards);
                  await this.preview[i].update({
                    done: [...this.preview[i].props.done, card],
                  });
                })
              );
            },
          },
          false
        );
        play();
      });
    };

    const pause = async () => {
      await this.update({ pausing: true });
    };

    const playPanel = (
      <Paper
        sx={{
          position: "absolute",
          left: 810,
          top: 930,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          boxShadow: "2px 2px rgba(0, 0, 0, 0.4)",
          p: 1,
        }}
      >
        <Grid container spacing={1}>
          <Grid
            item
            xs={12}
            sx={{
              display: "flex",
              justifyContent: "flex-start",
            }}
          >
            <Tooltip title={"Back"}>
              <div>
                <IconButton
                  disabled={this.props.playing || this.props.pos <= 0}
                  onClick={() => this.uiReset(this.props.pos - 1)}
                >
                  <SkipPreviousIcon sx={{ fontSize: "2.5rem" }} />
                </IconButton>
              </div>
            </Tooltip>
            {this.props.playing ? (
              <Tooltip title={"Pause"}>
                <div>
                  <IconButton
                    disabled={
                      this.props.pausing ||
                      this.props.pos + 1 >= this.props.states.length
                    }
                    onClick={() => pause()}
                  >
                    <PauseIcon sx={{ fontSize: "2.5rem" }} />
                  </IconButton>
                </div>
              </Tooltip>
            ) : (
              <Tooltip title={"Play"}>
                <div>
                  <IconButton
                    disabled={this.props.pos + 1 >= this.props.states.length}
                    onClick={() => play()}
                  >
                    <PlayArrowIcon sx={{ fontSize: "2.5rem" }} />
                  </IconButton>
                </div>
              </Tooltip>
            )}
            <Tooltip title={"Forward"}>
              <div>
                <IconButton
                  disabled={
                    this.props.playing ||
                    this.props.pos >= this.props.states.length - 1
                  }
                  onClick={() => this.uiReset(this.props.pos + 1)}
                >
                  <SkipNextIcon sx={{ fontSize: "2.5rem" }} />
                </IconButton>
              </div>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>
    );

    return (
      <Box sx={{ visibility: this.props.replay ? "visible" : "hidden" }}>
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
                left: 680 + i * 460,
                top: 940,
                // borderRadius: 9999,
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
        {playPanel}
      </Box>
    );
  }

  async bind(replay: IMatchReplay) {
    await this.update({ replay: null });
    if (replay == null) {
      return;
    }

    const decks = replay.decks.slice();
    replay.redraws.forEach((redraw, i) => {
      redraw.forEach(({ deck }) => (decks[i] = deck.slice()));
    });
    let state = initGame(replay.stage, decks);
    const states = [state];
    for (const moves of replay.moves) {
      if (moves.some((move) => !isGameMoveValid(state, move))) {
        MessageBar.error(`invalid replay record: [${JSON.stringify(replay)}]`);
        return;
      }
      state = moveGame(state, moves);
      states.push(state);
    }
    await this.update({
      replay,
      states,
      playing: false,
      pausing: false,
    });

    const { gui } = this.props;

    gui.board.scale.set(0.86);
    gui.board.position.set(8, -52);
    gui.board.update({ acceptInput: false });
    gui.board.uiUpdateOverlay(null);
    gui.szMeter.position.set(-500, 300);
    gui.szMeter.roots[1].position.set(980, 190);
    gui.spCutInAnim.position.set(-86, 0);
    // give the browser 300ms to update layout
    await new Promise((resolve) => setTimeout(resolve, 300));

    await Promise.all(
      states[0].players.map(async ({ hand, deck }, i) => {
        await this.preview[i].update({
          open: false,
          deck: [...hand, ...deck],
          done: hand.slice(),
        });
      })
    );

    await this.uiReset(0);
  }
}
