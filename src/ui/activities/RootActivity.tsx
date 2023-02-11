import {
  Box,
  Grid,
  Typography,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Activity } from "../Activity";
import { BasicButton } from "../Theme";
import { SettingsActivity } from "./SettingsActivity";
import { JoinMatchActivity } from "./JoinMatchActivity";
import { PublicMatchListActivity } from "./PublicMatchListActivity";
import { MatchActivity } from "./MatchActivity";
import { SocialIcon } from "react-social-icons";
import { TechnicalReportDialog } from "../components/TechnicalReportDialog";
import GitHubIcon from "@mui/icons-material/GitHub";
import DeveloperModeIcon from "@mui/icons-material/DeveloperMode";
import { ReplayListActivity } from "./ReplayListActivity";

class RootActivity_0 extends Activity {
  init() {
    return {
      zIndex: 0,
      title: "Menu",
    };
  }

  render() {
    return (
      <div>
        <Grid container spacing={4} sx={{ p: 2, flexGrow: 1 }}>
          <Grid item xs={12}>
            <BasicButton fullWidth onClick={() => MatchActivity.createMatch()}>
              Create Match
            </BasicButton>
          </Grid>
          <Grid item xs={12}>
            <BasicButton fullWidth onClick={() => JoinMatchActivity.show()}>
              Join Match
            </BasicButton>
          </Grid>
          <Grid item xs={12}>
            <BasicButton
              fullWidth
              onClick={() => PublicMatchListActivity.show()}
            >
              Public Match List
            </BasicButton>
          </Grid>
          <Grid item xs={12}>
            <BasicButton fullWidth onClick={() => ReplayListActivity.show()}>
              Replay List
            </BasicButton>
          </Grid>
          <Grid item xs={12}>
            <BasicButton fullWidth onClick={() => SettingsActivity.show()}>
              Settings
            </BasicButton>
          </Grid>
        </Grid>
        <Grid
          container
          spacing={2}
          sx={{
            // boxSizing: "border-box",
            position: "absolute",
            bottom: 0,
            left: 0,
            p: 2,
            pb: 0,
            mb: -2,
          }}
        >
          <Grid
            item
            xs={12}
            style={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <div style={{ flexGrow: 1 }}>
              <Tooltip title={"Technical report"}>
                <IconButton
                  onClick={() => TechnicalReportDialog.update({ open: true })}
                >
                  <DeveloperModeIcon />
                </IconButton>
              </Tooltip>
            </div>
            <IconButton
              onClick={() => window.open("https://discord.gg/fRT8ydhhxT")}
            >
              <SocialIcon
                url="https://discord.gg/fRT8ydhhxT"
                style={{ pointerEvents: "none" }}
              />
            </IconButton>
            <IconButton
              onClick={() =>
                window.open("https://github.com/xlnx/tableturf-replica")
              }
            >
              <GitHubIcon />
            </IconButton>
          </Grid>
          <Grid item xs={12}>
            <Divider style={{ width: "100%" }} />
          </Grid>
          <Grid
            item
            xs={12}
            style={{ display: "flex", justifyContent: "center" }}
          >
            <Typography
              style={{
                color: "grey",
                fontSize: "0.33rem",
                fontFamily: "ui-sans-serif,system-ui",
                textAlign: "center",
              }}
            >
              This website is not affiliated with Nintendo. All product names,
              logos, and brands are property of their respective owners.
            </Typography>
          </Grid>
        </Grid>
      </div>
    );
  }
}

export const RootActivity = new RootActivity_0();
