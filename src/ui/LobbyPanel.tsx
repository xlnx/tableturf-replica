import * as React from "react";
import { getLogger } from "loglevel";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import { ReactComponent } from "../engine/ReactComponent";
import { Box } from "@mui/system";
import { ColorPalette } from "./ColorPalette";
import { Lobby } from "../Lobby";
import { TableturfClientState, TableturfPlayerInfo } from "../Game";
import { PlayerBar } from "./PlayerBar";
import { ConnectDialog } from "./ConnectDialog";
import { Controller } from "../Controller";
import { BasicButton } from "./Theme";

const logger = getLogger("main-dialog");
logger.setLevel("info");

interface LobbyPanelProps {
  // dialog open
  open: boolean;
  // prepare phase
  ready: boolean;
  players: TableturfPlayerInfo[];
  // game info
  playing: boolean;
}

class LobbyPanel_0 extends ReactComponent<LobbyPanelProps> {
  constructor() {
    super();
    Controller.subscribe(this._handleUpdate.bind(this));
  }

  init(): LobbyPanelProps {
    return {
      // dialog open
      open: false,
      // prepare phase
      ready: false,
      players: Array(2).fill(null),
      // game info
      playing: false,
    };
  }

  toggle() {
    this.update({ open: !this.props.open });
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

  render(): React.ReactNode {
    const ctrlPanel = (
      <React.Fragment>
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
      </React.Fragment>
    );
    const colors = [ColorPalette.Player1, ColorPalette.Player2];
    const playerPanel = (
      <React.Fragment>
        <Grid container height="100%" direction="column" spacing={6}>
          <Grid item xs={4}>
            <PlayerBar
              disabled={true}
              color={colors[Lobby.playerId].primary}
              playerInfo={this.props.players[0]}
              onClick={() => logger.log(1)}
            />
          </Grid>
          <Grid item xs={4}>
            <PlayerBar
              disabled={
                this.props.playing
                // || (this.state.player2 && !this.state.player2.isBot())
              }
              color={colors[1 - Lobby.playerId].primary}
              playerInfo={this.props.players[1]}
              onClick={() => ConnectDialog.connect()}
            />
          </Grid>
        </Grid>
      </React.Fragment>
    );
    return (
      <Box
        sx={{
          left: 30,
          top: 100,
          position: "absolute",
        }}
        visibility={this.props.open ? "visible" : "hidden"}
      >
        <Paper
          sx={{
            width: 1000,
            height: 500,
            borderRadius: 2,
            p: 6,
          }}
        >
          <Grid container height="100%" spacing={6}>
            <Grid item xs={6}>
              {ctrlPanel}
            </Grid>
            <Grid item xs={6}>
              {playerPanel}
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  }
}

export const LobbyPanel = new LobbyPanel_0();
