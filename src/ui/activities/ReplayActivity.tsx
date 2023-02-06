import { Box, Grid, TextField } from "@mui/material";
import { Activity, ActivityPanel } from "../Activity";
import { InkResetAnimation } from "../InkResetAnimation";
import { MatchWindow } from "../scenes/match/MatchWindow";
import { ReplayListActivity } from "./ReplayListActivity";
import { I18n } from "../../i18n/I18n";
import { getStageById } from "../../core/Tableturf";
import { BasicButton } from "../Theme";
import { MessageBar } from "../components/MessageBar";
import { System } from "../../engine/System";
import { LoadingDialog } from "../components/LoadingDialog";

async function formatUrl(replay: IMatchReplay) {
  const { encodeReplay } = await import("../../game/Replay");
  const url = new URL(System.url.origin);
  url.searchParams.append("connect", "replay");
  url.searchParams.append("replay", encodeReplay(replay));
  return url.href;
}

interface ReplayActivityProps {
  replay: IMatchReplay;
}

class ReplayActivity_0 extends Activity<ReplayActivityProps> {
  init() {
    return {
      zIndex: 2,
      title: "Replay",
      parent: () => ReplayListActivity,
      //
      replay: null,
    };
  }

  async back() {
    MatchWindow.gui.hide();
    return true;
  }

  async start(replay: IMatchReplay) {
    const title = replay.players.join(" vs ");
    await this.update({ title, replay });
    await Promise.all([
      this.show(),
      InkResetAnimation.play(async () => {
        await Promise.all([MatchWindow.bind(replay), ActivityPanel.hide()]);
        MatchWindow.show();
      }),
    ]);
  }

  async loadReplay(base64: string) {
    try {
      const task = async () => {
        const { decodeReplay } = await import("../../game/Replay");
        const replay = decodeReplay(base64);
        await this.start(replay);
        ReplayListActivity.addReplay(replay);
      };
      await LoadingDialog.wait({
        task: task(),
        message: "Loading Replay...",
      });
    } catch (err) {
      MessageBar.error(err);
    }
  }

  render() {
    const { replay } = this.props;

    const handleCopyLink = async () => {
      const url = await LoadingDialog.wait({
        task: formatUrl(replay),
        message: "Compressing Replay...",
      });
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        MessageBar.success(`replay link copied: [${url}]`);
      } else {
        console.log(url);
        MessageBar.warning(`logged to console since context is not secure`);
      }
    };

    const bottomPanel = (
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
            <BasicButton fullWidth onClick={handleCopyLink}>
              Share Replay Link
            </BasicButton>
          </Grid>
        </Grid>
      </Box>
    );

    return (
      <div>
        <Grid container spacing={4} sx={{ p: 2, flexGrow: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              variant="standard"
              label={"Start Time"}
              value={new Date(replay.startTime).toLocaleString()}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              variant="standard"
              label={"Result"}
              value={
                replay.winner == null
                  ? "Draw"
                  : `${replay.players[replay.winner]} win`
              }
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              variant="standard"
              label={"Stage"}
              value={I18n.localize(
                "CommonMsg/MiniGame/MiniGameMapName",
                getStageById(replay.stage).name
              )}
            />
          </Grid>
        </Grid>
        {bottomPanel}
      </div>
    );
  }
}

export const ReplayActivity = new ReplayActivity_0();
