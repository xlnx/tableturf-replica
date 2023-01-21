import React from "react";
import { Grid, TextField, Box } from "@mui/material";
import { Activity } from "../Activity";
import { BasicButton } from "../Theme";
import { MessageBar } from "../components/MessageBar";
import { OnlineLoungeActivity } from "./OnlineLoungeActivity";
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
    const matchID = new URL(url).searchParams.get("match");
    if (!matchID) {
      throw `invalid invite link: ${url}`;
    }
    await MatchActivity.joinMatch(matchID);
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
