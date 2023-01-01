import { Box, Grid, MenuItem, TextField } from "@mui/material";
import { Activity, ActivityPanel } from "../Activity";
import { RootActivity } from "./RootActivity";
import { BasicButton } from "../Theme";
import { getLogger } from "loglevel";
import { TableturfClientState } from "../../Game";
import { Client } from "../../client/Client";
import { AlertDialog } from "../components/AlertDialog";
import { P2PHost } from "../../client/P2P";
import { MessageBar } from "../components/MessageBar";
import { System } from "../../engine/System";
import { GamePlayWindow } from "../GamePlayWindow";
import { InkResetAnimation } from "../InkResetAnimation";
import { TryOutWindow } from "../TryOutWindow";
import { getStages } from "../../core/Tableturf";
import { I18n } from "../../i18n/I18n";

const logger = getLogger("main-dialog");
logger.setLevel("info");

interface MatchActivityProps {
  client: Client;
  player: IPlayerId;
  state: TableturfClientState;
  manualExit: boolean;
}

class MatchActivity_0 extends Activity<MatchActivityProps> {
  init() {
    return {
      zIndex: 10,
      title: "Match",
      parent: () => RootActivity,
      //
      client: null,
      player: 0 as IPlayerId,
      state: null,
      manualExit: false,
    };
  }

  async start(client: Client) {
    console.assert(client.isConnected());
    await this.update({
      client,
      player: client.playerId,
      state: client.state,
      manualExit: false,
    });
    client.on("update", this.handleUpdate.bind(this));
    client.on("disconnect", async () => {
      await this.handleDisconnect();
      await this.props.parent().show();
    });
    GamePlayWindow.bind(client);
    await this.show();
  }

  async back() {
    console.assert(this.props.client);
    const ok = await AlertDialog.prompt({
      msg: "Leave the room now?",
    });
    if (ok) {
      await this.update({ manualExit: true });
      this.props.client.stop();
      await this.handleDisconnect();
    }
    return ok;
  }

  private async handleDisconnect() {
    await this.update({ client: null });
    await this.uiHandlePlayerLeave();
  }

  private async uiHandlePlayerLeave() {
    logger.debug("uiHandlePlayerLeave");
    MessageBar.warning("${player} left the room");
    if (!this.props.manualExit) {
      await AlertDialog.prompt({
        msg: "A communication error has occurred",
        cancelMsg: null,
      });
    }
    await InkResetAnimation.play(async () => {
      GamePlayWindow.send("cancel");
      await ActivityPanel.show();
      TryOutWindow.show();
    });
  }

  private async handleUpdate(
    state: TableturfClientState,
    { G: G0, ctx: ctx0 }: TableturfClientState
  ) {
    const { G, ctx } = state;

    const enter = (phase: string) =>
      ctx.phase == phase && ctx0.phase != ctx.phase;

    for (let i = 0; i < 2; ++i) {
      if (!G.players[i] && !!G0.players[i]) {
        await this.uiHandlePlayerLeave();
      }
    }

    // botInitHook
    if (enter("botInitHook")) {
      this.props.client.send("sync");
    }

    // init
    if (enter("init")) {
      await InkResetAnimation.play(async () => {
        await GamePlayWindow.uiReset(G);
        this.props.client.send("sync");
        await ActivityPanel.hide();
        GamePlayWindow.show();
      });
    }

    await this.update({ state });
  }

  isControlDisabled() {
    return !(this.props.client && this.props.state.ctx.phase == "prepare");
  }

  isHostControlDisabled() {
    return this.isControlDisabled() || !this.props.client.isHost();
  }

  render() {
    const copyInviteLink = async () => {
      const url = new URL(
        `?connect=player&match=${this.props.client.matchId}`,
        System.url.origin
      ).href;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        MessageBar.success(`successfully copied invite link to clipboard`);
      } else {
        console.log(url);
        MessageBar.warning(`logged to console since context is not secure`);
      }
    };

    let copyInviteLinkBtn = null;
    if (this.props.client && this.props.client instanceof P2PHost) {
      copyInviteLinkBtn = (
        <Grid item xs={6}>
          <BasicButton
            fullWidth
            disabled={this.isHostControlDisabled()}
            onClick={copyInviteLink}
          >
            Copy Invite Link
          </BasicButton>
        </Grid>
      );
    }

    const stageMenuItems = getStages().map((stage, i) => (
      <MenuItem value={i} key={i}>
        {I18n.localize("CommonMsg/MiniGame/MiniGameMapName", stage.name)}
      </MenuItem>
    ));

    return (
      <>
        <Grid container spacing={4} sx={{ p: 2, flexGrow: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              variant="standard"
              label="Stage"
              disabled={this.isHostControlDisabled()}
              value={this.props.state.G.stage}
              onChange={({ target }) =>
                this.props.client.send("updateState", {
                  stage: Number(target.value),
                })
              }
            >
              {stageMenuItems}
            </TextField>
          </Grid>
        </Grid>
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
                selected={this.props.state.G.ready[this.props.player]}
                disabled={this.isControlDisabled()}
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
