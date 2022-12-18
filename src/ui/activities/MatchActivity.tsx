import { Grid } from "@mui/material";
import { Activity } from "../Activity";
import { RootActivity } from "./RootActivity";
import { BasicButton } from "../Theme";
import { Lobby } from "../../Lobby";
import { Controller } from "../../Controller";
import { getLogger } from "loglevel";
import { TableturfClientState, TableturfPlayerInfo } from "../../Game";

const logger = getLogger("main-dialog");
logger.setLevel("info");

interface LobbyPanelProps {
  // prepare phase
  ready: boolean;
  players: (TableturfPlayerInfo & { time: string })[];
  // game info
  playing: boolean;
}

class MatchActivity_0 extends Activity<LobbyPanelProps> {
  constructor() {
    super();
    Controller.subscribe(this._handleUpdate.bind(this));
  }

  init() {
    return {
      zIndex: 10,
      title: "Match",
      parent: () => RootActivity,
      ready: false,
      players: Array(2).fill(null),
      playing: false,
    };
  }

  private _handleUpdate(state: TableturfClientState) {
    logger.log("update state:", state);
    const { G, ctx } = state;
    if (ctx.phase == "game") {
      if (!this.props.playing) {
        this.update({ playing: true });
      }
    }
    if (ctx.phase == "prepare") {
      this.update({
        ready: G.ready[Lobby.playerId],
        players: G.players,
        playing: false,
      });
    }
  }

  render() {
    return (
      <>
        <Grid container height="100%" direction="column" spacing={3}>
          <Grid item xs={8}>
            <BasicButton
              disabled={this.props.playing}
              sx={{ width: "100%", height: "100%" }}
            >
              Btn1
            </BasicButton>
          </Grid>
          <Grid item xs={4}>
            <BasicButton
              disabled={this.props.playing}
              fullWidth
              sx={{ fontSize: "1.2rem" }}
              // sx={{ width: "100%", height: "100%" }}
              selected={this.props.ready}
              onChange={() => Lobby.send("toggleReady")}
            >
              Ready!
            </BasicButton>
          </Grid>
        </Grid>
      </>
    );
  }
}

export const MatchActivity = new MatchActivity_0();
