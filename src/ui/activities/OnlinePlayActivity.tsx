import React from "react";
import { Grid, TextField, Box } from "@mui/material";
import { Activity } from "../Activity";
import { RootActivity } from "./RootActivity";
import { BasicButton } from "../Theme";
import { Lobby } from "../../Lobby";
import { MessageBar } from "../components/MessageBar";
import { LoadingDialog } from "../components/LoadingDialog";
import { ViaInviteLinkActivity } from "./ViaInviteLinkActivity";
import { P2PHost } from "../../net/P2P";
import { MatchActivity } from "./MatchActivity";

class OnlinePlayActivity_0 extends Activity {
  init() {
    return {
      zIndex: 1,
      title: "Online Play",
      parent: () => RootActivity,
    };
  }

  render() {
    const newRoom = async () => {
      const client = await LoadingDialog.wait({
        task: P2PHost.create(),
        message: "Creating Room...",
      });
      MatchActivity.run(client);
    };

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
            <Grid item xs={6}>
              <BasicButton
                fullWidth
                onClick={() => ViaInviteLinkActivity.show()}
              >
                Via Invite Link
              </BasicButton>
            </Grid>
            <Grid item xs={6}>
              <BasicButton fullWidth onClick={newRoom}>
                + New Room
              </BasicButton>
            </Grid>
          </Grid>
        </Box>
      </>
    );
  }
}

export const OnlinePlayActivity = new OnlinePlayActivity_0();
