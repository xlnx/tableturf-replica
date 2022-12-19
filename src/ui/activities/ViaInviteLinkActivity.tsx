import React from "react";
import { Grid, TextField, Box } from "@mui/material";
import { Activity } from "../Activity";
import { BasicButton } from "../Theme";
import { Lobby } from "../../Lobby";
import { MessageBar } from "../components/MessageBar";
import { LoadingDialog } from "../components/LoadingDialog";
import { OnlinePlayActivity } from "./OnlinePlayActivity";
import { Client } from "../../net/Client";
import { P2PClient } from "../../net/P2P";

class ViaInviteLinkActivity_0 extends Activity {
  init() {
    return {
      zIndex: 2,
      title: "Via Invite Link",
      parent: () => OnlinePlayActivity,
    };
  }

  render() {
    const [state, setState] = React.useState({ url: "" });

    const handleConnect = async () => {
      const { url } = state;
      try {
        const matchId = new URL(url).searchParams.get("peer");
        if (!matchId) {
          throw `invalid invite link: ${url}`;
        }
        if (Client.current && Client.current.matchId == matchId) {
          throw `cannot connect to yourself`;
        }
        await LoadingDialog.wait({
          task: P2PClient.connect(matchId),
          message: "Connecting...",
        });
        MessageBar.success(`connected to ${url}`);
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
              variant="standard"
              label="Invite Link"
              autoComplete="off"
              onChange={(e) => setState({ ...state, url: e.target.value })}
              sx={{ width: "100%" }}
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

export const ViaInviteLinkActivity = new ViaInviteLinkActivity_0();
