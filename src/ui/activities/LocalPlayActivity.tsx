import { Grid } from "@mui/material";
import { Activity } from "../Activity";
import { RootActivity } from "./RootActivity";

class LocalPlayActivity_0 extends Activity {
  init() {
    return {
      zIndex: 1,
      title: "Local Play",
      parent: () => RootActivity,
    };
  }

  render() {
    return <Grid container spacing={4}></Grid>;
  }
}

export const LocalPlayActivity = new LocalPlayActivity_0();
