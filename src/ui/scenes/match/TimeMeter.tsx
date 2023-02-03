import { Box, Paper } from "@mui/material";
import { ReactComponent } from "../../../engine/ReactComponent";
import { getLogger } from "loglevel";

const logger = getLogger("time-meter");
logger.setLevel("info");

interface TimeMeterProps {
  timeSec: number;
}

class Countdown {
  private t1: number;
  private canceled = false;

  constructor(
    from: string,
    elapseSec: number,
    private readonly callback: (sec: number) => void
  ) {
    this.t1 = new Date(from).getTime() + elapseSec * 1000;
    this.tick();
  }

  cancel() {
    this.canceled = true;
  }

  private tick() {
    if (this.canceled) {
      return;
    }
    const t = new Date().getTime();
    const dt = this.t1 - t;
    if (dt <= 0) {
      this.callback(0);
      return;
    }
    const sec = Math.ceil(dt / 1000);
    this.callback(sec);
    setTimeout(this.tick.bind(this), (dt % 1000) + 5);
  }
}

export class TimeMeter extends ReactComponent<TimeMeterProps> {
  private countdown: Countdown;

  init(): TimeMeterProps {
    return {
      timeSec: -1,
    };
  }

  start(from: string, elapseSec: number) {
    logger.log("start", from, elapseSec);
    this.stop();
    this.countdown = new Countdown(from, elapseSec, (timeSec) => {
      this.update({ timeSec });
    });
  }

  stop() {
    this.countdown && this.countdown.cancel();
    this.countdown = null;
  }

  render() {
    const { timeSec } = this.props;
    let timeStr = "--:--";
    if (timeSec >= 0) {
      const sec = Math.floor(timeSec % 60);
      const min = Math.floor(timeSec / 60);
      const format2 = (e: number) => {
        const s = "00" + e;
        return s.substring(s.length - 2);
      };
      timeStr = `${format2(min)}:${format2(sec)}`;
    }
    return (
      <Paper
        sx={{
          position: "absolute",
          width: 180,
          height: 82,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          boxShadow: "2px 2px rgba(0, 0, 0, 0.4)",
        }}
      >
        <Box
          sx={{
            textAlign: "center",
            justifyContent: "center",
            color: timeSec >= 0 && timeSec <= 10 ? "#f04833" : "white",
            fontFamily: "Splatoon2",
            textShadow: "2px 2px black",
            fontSize: 44,
            transition: "color 100ms ease-out",
          }}
        >
          {timeStr}
        </Box>
      </Paper>
    );
  }
}
