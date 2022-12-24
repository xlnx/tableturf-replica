import React from "react";
import { Box, Grid, TextField } from "@mui/material";
import { Activity } from "../Activity";
import { BotListActivity } from "./BotListActivity";
import { BasicButton } from "../Theme";
import { BotClient } from "../../client/bot/Client";
import { LoadingDialog } from "../components/LoadingDialog";
import { RemoteBot } from "../../client/bot/Remote";
import { MessageBar } from "../components/MessageBar";
import { MatchActivity } from "./MatchActivity";

class BotViaNetworkActivity_0 extends Activity {
  init() {
    return {
      zIndex: 2,
      title: "Connect To Bot",
      parent: () => BotListActivity,
    };
  }

  async connect(url: string) {
    const client = await LoadingDialog.wait({
      message: `Connecting ${url} ...`,
      task: BotClient.connect({
        id: "",
        info: { name: "" },
        connect: async (timeout) => await RemoteBot.connect({ url, timeout }),
      }),
    });
    MessageBar.success(`connected to ${url}`);
    await MatchActivity.start(client);
  }

  render() {
    const [state, setState] = React.useState({ url: "" });
    const handleConnect = async () => {
      try {
        this.connect(state.url);
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
              label="Bot Url"
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

export const BotViaNetworkActivity = new BotViaNetworkActivity_0();
