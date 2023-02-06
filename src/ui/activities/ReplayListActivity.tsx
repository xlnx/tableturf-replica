import { Button, CardHeader, Grid } from "@mui/material";
import { Activity } from "../Activity";
import { MessageBar } from "../components/MessageBar";
import { RootActivity } from "./RootActivity";
import { ReplayActivity } from "./ReplayActivity";
import { v4 } from "uuid";

interface Replay {
  id: string;
  replay: IMatchReplay;
}

interface ReplayListActivityProps {
  replays: Replay[];
}

class ReplayListActivity_0 extends Activity<ReplayListActivityProps> {
  init() {
    return {
      zIndex: 1,
      title: "Replay List",
      parent: () => RootActivity,
      //
      replays: [],
    };
  }

  addReplay(replay: IMatchReplay) {
    this.update({ replays: [{ id: v4(), replay }, ...this.props.replays] });
    console.log("recieved replay: ", replay);
    MessageBar.success("replay has been recorded");
  }

  render() {
    return (
      <Grid
        container
        spacing={2}
        sx={{ height: "100%", overflow: "auto", p: 2 }}
      >
        {this.props.replays.map(({ id, replay }) => (
          <Grid item xs={12} key={id}>
            <Button fullWidth onClick={() => ReplayActivity.start(replay)}>
              <CardHeader
                title={replay.players.join(" vs ")}
                subheader={new Date(replay.startTime).toLocaleString()}
              />
            </Button>
          </Grid>
        ))}
      </Grid>
    );
  }
}

export const ReplayListActivity = new ReplayListActivity_0();
