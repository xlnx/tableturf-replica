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
    } else {
      MessageBar.warning("${player} left the room");
    }
  }

  private async handleUpdate(
    { G, ctx }: TableturfClientState,
    { G: G0, ctx: ctx0 }: TableturfClientState
  ) {
    const enter = (phase: string) =>
      ctx.phase == phase && ctx0.phase != ctx.phase;

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

    switch (ctx.phase) {
      case "game":
        if (!this.props.playing) {
          await this.update({ playing: true });
        }
        return;
      case "prepare":
        await this.update({
          ready: G.ready[this.props.client.playerId],
          players: G.players,
          playing: false,
        });
        return;
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
          <BasicButton fullWidth onClick={copyInviteLink}>
            Copy Invite Link
          </BasicButton>
        </Grid>
      );
    }

    return (
      // <Grid
      //   container
      //   height="100%"
      //   direction="column"
      //   spacing={3}
      //   sx={{ p: 2 }}
      // >
      //   <Grid item xs={8}>
      //     <BasicButton
      //       disabled={this.props.playing}
      //       sx={{ width: "100%", height: "100%" }}
      //     >
      //       Btn1
      //     </BasicButton>
      //   </Grid>
      //   <Grid item xs={4}>
      //     <BasicButton
      //       disabled={this.props.playing}
      //       fullWidth
      //       sx={{ fontSize: "1.2rem" }}
      //       // sx={{ width: "100%", height: "100%" }}
      //       selected={this.props.ready}
      //       onChange={() => Lobby.send("toggleReady")}
      //     >
      //       Ready!
      //     </BasicButton>
      //   </Grid>
      // </Grid>
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
