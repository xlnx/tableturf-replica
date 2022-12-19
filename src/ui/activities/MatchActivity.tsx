import { Box, Grid } from "@mui/material";
import { Activity } from "../Activity";
import { RootActivity } from "./RootActivity";
import { BasicButton } from "../Theme";
import { Lobby } from "../../Lobby";
import { getLogger } from "loglevel";
import { TableturfClientState, TableturfPlayerInfo } from "../../Game";
import { Client } from "../../net/Client";
import { AlertDialog } from "../components/AlertDialog";
import { P2PHost } from "../../net/P2P";
import { MessageBar } from "../components/MessageBar";
import { System } from "../../engine/System";

const logger = getLogger("main-dialog");
logger.setLevel("info");

interface MatchActivityProps {
  client: Client;
  // prepare phase
  ready: boolean;
  players: (TableturfPlayerInfo & { time: string })[];
  // game info
  playing: boolean;
}

class MatchActivity_0 extends Activity<MatchActivityProps> {
  constructor() {
    super();
    // Controller.subscribe(this._handleUpdate.bind(this));
  }

  async run(client: Client) {
    await this.update({ client });
    this.show();
  }

  init() {
    return {
      zIndex: 10,
      title: "Match",
      parent: () => RootActivity,
      //
      client: null,
      ready: false,
      players: Array(2).fill(null),
      playing: false,
    };
  }

  async back() {
    console.assert(this.props.client);
    const ok = await AlertDialog.prompt({
      msg: "Leave the room now ?",
    });
    if (ok) {
      this.props.client.stop();
      await this.update({ client: null });
    }
    return ok;
  }

  // private _handleUpdate(state: TableturfClientState) {
  //   logger.log("update state:", state);
  //   const { G, ctx } = state;
  //   if (ctx.phase == "game") {
  //     if (!this.props.playing) {
  //       this.update({ playing: true });
  //     }
  //   }
  //   if (ctx.phase == "prepare") {
  //     this.update({
  //       ready: G.ready[Lobby.playerId],
  //       players: G.players,
  //       playing: false,
  //     });
  //   }
  // }

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
    if (this.props.client instanceof P2PHost) {
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
              <BasicButton fullWidth onClick={() => console.log("ready")}>
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
