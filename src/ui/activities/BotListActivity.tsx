import { Box, Grid } from "@mui/material";
import { Activity } from "../Activity";
import { RootActivity } from "./RootActivity";
import { BasicButton } from "../Theme";
import { BotViaNetworkActivity } from "./BotViaNetworkActivity";

class BotListActivity_0 extends Activity {
  init() {
    return {
      zIndex: 1,
      title: "Bots List",
      parent: () => RootActivity,
    };
  }

  render() {
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
