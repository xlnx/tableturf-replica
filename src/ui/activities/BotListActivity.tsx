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

const bots = [DummyBot.connector];

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
      await MatchActivity.start(client);
    };

    const li = bots.map((connector) => (
      <Box key={connector.id}>
        <BasicButton fullWidth onClick={() => handleConnect(connector)}>
          {connector.info.name}
        </BasicButton>
      </Box>
    ));

    return (
      <>
        <Grid container spacing={4} sx={{ p: 2, flexGrow: 1 }}>
          <Grid item xs={12}>
            <List>{li}</List>
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
