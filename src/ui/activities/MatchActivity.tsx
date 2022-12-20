import { Box, Grid } from "@mui/material";
import { Activity } from "../Activity";
import { RootActivity } from "./RootActivity";
import { BasicButton } from "../Theme";
import { getLogger } from "loglevel";
import { TableturfClientState, TableturfPlayerInfo } from "../../Game";
import { Client } from "../../net/Client";
import { AlertDialog } from "../components/AlertDialog";
import { P2PHost } from "../../net/P2P";
import { MessageBar } from "../components/MessageBar";
import { System } from "../../engine/System";
import { GamePlayWindow } from "../GamePlayWindow";
import { InkResetAnimation } from "../InkResetAnimation";
import { TryOutWindow } from "../TryOutWindow";

const logger = getLogger("main-dialog");
logger.setLevel("info");

interface MatchActivityProps {
  client: Client;
  manualExit: boolean;
  // prepare phase
  ready: boolean;
  players: TableturfPlayerInfo[];
  // game info
  playing: boolean;
}

class MatchActivity_0 extends Activity<MatchActivityProps> {
  init() {
    return {
      zIndex: 10,
      title: "Match",
      parent: () => RootActivity,
      //
      client: null,
      manualExit: false,
      ready: false,
      players: Array(2).fill(null),
      playing: false,
    };
  }

  async start(client: Client) {
    await this.update({ client, manualExit: false });
    // client.on("data", this.handleData.bind(this));
    client.on("update", this.handleUpdate.bind(this));
    client.on("disconnect", async () => {
      await this.handleDisconnect();
      this.props.parent().show();
    });
    GamePlayWindow.bind(client);
    this.show();
  }

  async back() {
    console.assert(this.props.client);
    const ok = await AlertDialog.prompt({
      msg: "Leave the room now ?",
    });
    if (ok) {
      await this.update({ manualExit: true });
      this.props.client.stop();
      await this.handleDisconnect();
    }
    return ok;
  }

  private isHost() {
    return this.props.client && this.props.client instanceof P2PHost;
  }

  private async handleDisconnect() {
    await this.update({ client: null });
    await this.uiHandlePlayerLeave();
  }

  private async uiHandlePlayerLeave() {
    logger.debug("uiHandlePlayerLeave");
    MessageBar.warning("${player} left the room");
    if (this.props.playing) {
      if (!this.props.manualExit) {
        await AlertDialog.prompt({
          msg: "A communication error has occurred",
          cancelMsg: null,
        });
      }
      InkResetAnimation.play(async () => {
        GamePlayWindow.send("cancel");
        TryOutWindow.show();
      });
    }
  }

  private async handleUpdate(
    { G, ctx }: TableturfClientState,
    { G: G0, ctx: ctx0 }: TableturfClientState
  ) {
    const enter = (phase: string) =>
      ctx.phase == phase && ctx0.phase != ctx.phase;
    const leave = (phase: string) =>
      ctx0.phase == phase && ctx0.phase != ctx.phase;

    for (let i = 0; i < 2; ++i) {
      if (!G.players[i] && !!G0.players[i]) {
        this.uiHandlePlayerLeave();
      }
    }

    // botInitHook
    if (enter("botInitHook")) {
      this.props.client.send("sync");
    }

    // init
    if (enter("init")) {
      InkResetAnimation.play(async () => {
        GamePlayWindow.uiReset(G);
        this.props.client.send("sync");
        GamePlayWindow.show();
      });
    }

    if (leave("prepare")) {
      console.assert(!this.props.playing);
      await this.update({ playing: true });
    }

    if (ctx.phase == "prepare") {
      await this.update({
        ready: G.ready[this.props.client.playerId],
        players: G.players,
        playing: false,
      });
    }
  }

  render() {
    const copyInviteLink = () => {
      const url = new URL(
        `?peer=${this.props.client.matchId}`,
        System.url.origin
      ).href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        MessageBar.success(`successfully copied invite link to clipboard`);
      } else {
        console.log(url);
        MessageBar.warning(`logged to console since context is not secure`);
      }
    };

    let copyInviteLinkBtn = null;
    if (this.isHost()) {
      copyInviteLinkBtn = (
        <Grid item xs={6}>
          <BasicButton
            fullWidth
            disabled={this.props.playing}
            onClick={copyInviteLink}
          >
            Copy Invite Link
          </BasicButton>
        </Grid>
      );
    }

    return (
      <>
        <Grid container spacing={4} sx={{ p: 2, flexGrow: 1 }}></Grid>
        <Box
          sx={{
            boxSizing: "border-box",
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            p: 2,
          }}
        >
          <Grid container spacing={4} justifyContent={"flex-end"}>
            {copyInviteLinkBtn}
            <Grid item xs={6}>
              <BasicButton
                fullWidth
                selected={this.props.ready}
                disabled={this.props.playing}
                onClick={() => this.props.client.send("toggleReady")}
              >
                Ready!
              </BasicButton>
            </Grid>
          </Grid>
        </Box>
      </>
    );
  }
}

export const MatchActivity = new MatchActivity_0();
