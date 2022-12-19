import { Box, Grid } from "@mui/material";
import { Activity } from "../Activity";
import { BasicButton } from "../Theme";
import { LocalPlayActivity } from "./LocalPlayActivity";
import { OnlinePlayActivity } from "./OnlinePlayActivity";

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
          <BasicButton fullWidth onClick={() => OnlinePlayActivity.show()}>
            Online Play
          </BasicButton>
        </Grid>
        <Grid item xs={12}>
          <BasicButton fullWidth onClick={() => LocalPlayActivity.show()}>
            Local Play
          </BasicButton>
        </Grid>
      </Grid>
    );
  }
}

export const RootActivity = new RootActivity_0();
