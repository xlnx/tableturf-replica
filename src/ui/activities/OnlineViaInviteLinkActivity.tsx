import React from "react";
import { Grid, TextField, Box } from "@mui/material";
import { Activity } from "../Activity";
import { BasicButton } from "../Theme";
import { MessageBar } from "../components/MessageBar";
import { LoadingDialog } from "../components/LoadingDialog";
import { OnlineLoungeActivity } from "./OnlineLoungeActivity";
import { Client } from "../../client/Client";
import { P2PClient } from "../../client/P2P";
import { MatchActivity } from "./MatchActivity";

class OnlineViaInviteLinkActivity_0 extends Activity {
  init() {
    return {
      zIndex: 2,
      title: "Via Invite Link",
      parent: () => OnlineLoungeActivity,
    };
  }

  async connect(url: string) {
    const matchId = new URL(url).searchParams.get("match");
    if (!matchId) {
      throw `invalid invite link: ${url}`;
    }
    await this.connectMatch(matchId);
  }

  async connectMatch(matchId: string) {
    const client = await LoadingDialog.wait({
      task: P2PClient.connect(matchId),
      message: "Connecting...",
    });
    MessageBar.success(`connected to ${matchId}`);
    await MatchActivity.start(client);
  }

  render() {
    const [state, setState] = React.useState({ url: "" });
    const handleConnect = async () => {
      try {
        await this.connect(state.url);
      } catch (err) {
        MessageBar.error(err);
      }
    };
    return (
      <>
        <Grid container spacing={4} sx={{ p: 2, flexGrow: 1 }}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              variant="standard"
              label="Invite Link"
              autoComplete="off"
              onChange={(e) => setState({ ...state, url: e.target.value })}
            />
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
            <Grid item xs={6}>
              <BasicButton fullWidth onClick={handleConnect}>
                Connect
              </BasicButton>
            </Grid>
          </Grid>
        </Box>
      </>
    );
  }
}

export const OnlineViaInviteLinkActivity = new OnlineViaInviteLinkActivity_0();
