import React from "react";
import { Grid, TextField, Box } from "@mui/material";
import { Activity } from "../Activity";
import { RootActivity } from "./RootActivity";
import { BasicButton } from "../Theme";
import { P2PHost } from "../../P2P";
import { Lobby } from "../../Lobby";
import { MessageBar } from "../components/MessageBar";
import { LoadingBar } from "../components/LoadingBar";
import { ViaInviteLinkActivity } from "./ViaInviteLinkActivity";

class OnlinePlayActivity_0 extends Activity {
  init() {
    return {
      zIndex: 1,
      title: "Online Play",
      parent: () => RootActivity,
    };
  }

  render() {
    // const newRoom = () => {
    //   if (navigator.clipboard) {
    //     navigator.clipboard.writeText(P2PHost.url);
    //     MessageBar.success(`successfully copied invite link to clipboard`);
    //   } else {
    //     console.log(P2PHost.url);
    //     MessageBar.warning(`logged to console since context is not secure`);
    //   }
    // };
    const newRoom = () => {};

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
                sx={{ width: "100%" }}
                onClick={() => ViaInviteLinkActivity.show()}
              >
                Via Invite Link
              </BasicButton>
            </Grid>
            <Grid item xs={6}>
              <BasicButton sx={{ width: "100%" }} onClick={newRoom}>
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
