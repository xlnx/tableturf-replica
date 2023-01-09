import { Box, Grid, List } from "@mui/material";
import { Activity } from "../Activity";
import { RootActivity } from "./RootActivity";
import { BasicButton } from "../Theme";
import { BotViaNetworkActivity } from "./BotViaNetworkActivity";
import { DummyBot } from "../../bots/DummyBot";
import { LoadingDialog } from "../components/LoadingDialog";
import { MatchActivity } from "./MatchActivity";
import { BotClient } from "../../client/bot/Client";
import { BotConnector } from "../../client/bot/Bot";
import { RandomBot } from "../../bots/RandomBot";
import { RemoteBot } from "../../client/bot/Remote";
import { MessageBar } from "../components/MessageBar";

const bots = [
  DummyBot.connector,
  RandomBot.connector,
  {
    id: "[fga401]",
    info: {
      name: "[fga401]",
    },
    connect: async (timeout) =>
      await RemoteBot.connect({ url: "wss://api.koishi.top:5140", timeout }),
  },
];

class BotListActivity_0 extends Activity {
  init() {
    return {
      zIndex: 1,
      title: "Bots List",
      parent: () => RootActivity,
    };
  }

  render() {
    const handleConnect = async (connector: BotConnector) => {
      const client = await LoadingDialog.wait({
        message: "Connecting...",
        task: BotClient.connect(connector),
      });
      MessageBar.success(`connected to ${connector.info.name}`);
      await MatchActivity.start(client);
    };

    const li = bots.map((connector) => (
      <Grid item xs={12} key={connector.id}>
        <BasicButton fullWidth onClick={() => handleConnect(connector)}>
          {connector.info.name}
        </BasicButton>
      </Grid>
    ));

    return (
      <>
        <Grid container spacing={4} sx={{ p: 2, flexGrow: 1 }}>
          {li}
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
              <BasicButton
                fullWidth
                onClick={() => BotViaNetworkActivity.show()}
              >
                Via Network
              </BasicButton>
            </Grid>
          </Grid>
        </Box>
      </>
    );
  }
}

export const BotListActivity = new BotListActivity_0();
