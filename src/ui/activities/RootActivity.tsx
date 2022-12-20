import { Grid } from "@mui/material";
import { Activity } from "../Activity";
import { BasicButton } from "../Theme";
import { BotListActivity } from "./BotListActivity";
import { OnlineLoungeActivity } from "./OnlineLoungeActivity";

class RootActivity_0 extends Activity {
  init() {
    return {
      zIndex: 0,
      title: "Menu",
    };
  }

  render() {
    return (
      <Grid container spacing={4} sx={{ p: 2 }}>
        <Grid item xs={12}>
          <BasicButton fullWidth onClick={() => OnlineLoungeActivity.show()}>
            VS Player
          </BasicButton>
        </Grid>
        <Grid item xs={12}>
          <BasicButton fullWidth onClick={() => BotListActivity.show()}>
            VS Bot
          </BasicButton>
        </Grid>
      </Grid>
    );
  }
}

export const RootActivity = new RootActivity_0();
