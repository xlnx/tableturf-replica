import React from "react";
import { Grid, TextField, Box } from "@mui/material";
import { Activity } from "../Activity";
import { BasicButton } from "../Theme";
import { P2PHost } from "../../P2P";
import { Lobby } from "../../Lobby";
import { MessageBar } from "../components/MessageBar";
import { LoadingBar } from "../components/LoadingBar";
import { OnlinePlayActivity } from "./OnlinePlayActivity";

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
        const peer = new URL(url).searchParams.get("peer");
        if (peer == P2PHost.matchId) {
          throw `cannot connect to yourself`;
        }
        if (!peer) {
          throw `invalid invite link: ${url}`;
        }
        await LoadingBar.wait(Lobby.connectP2P(peer, 20), {
          message: "Connecting...",
        });
        MessageBar.success(`connected to peer ${url}`);
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
              <BasicButton sx={{ width: "100%" }} onClick={handleConnect}>
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
