import { Activity } from "../Activity";
import { Box, Grid, TextField, FormHelperText, Tooltip } from "@mui/material";
import { RootActivity } from "./RootActivity";
import { BasicButton } from "../Theme";
import { DB } from "../../Database";
import { MessageBar } from "../components/MessageBar";
import { getNameError } from "../../Terms";

interface SettingsActivityProps {
  name: string;
}

class SettingsActivity_0 extends Activity<SettingsActivityProps> {
  init() {
    return {
      zIndex: 1,
      title: "Settings",
      parent: () => RootActivity,
      //
      name: "",
    };
  }

  async show() {
    await this.update({
      name: DB.read().playerName,
    });
    await super.show();
  }

  render() {
    const nameError = getNameError(this.props.name);
    return (
      <div>
        <Grid container spacing={4} sx={{ p: 2, flexGrow: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              variant="standard"
              label="Player name"
              autoComplete="off"
              color={!nameError ? "primary" : "error"}
              value={this.props.name}
              inputProps={{
                maxLength: 24,
                "aria-describedby": nameError ? "settings-name-error-text" : "",
              }}
              onChange={({ target }) => this.update({ name: target.value })}
            />
            {!nameError ? null : (
              <FormHelperText id="settings-name-error-text">
                {nameError}
              </FormHelperText>
            )}
          </Grid>
          <Grid item xs={12}>
            <Tooltip
              title={
                "If you encounter any rendering glitch, try clearing the renderer cache and refresh the page"
              }
            >
              <div>
                <BasicButton
                  fullWidth
                  onClick={() => {
                    window.localStorage.clear();
                    MessageBar.success("renderer cache has been cleared");
                  }}
                >
                  Clear Renderer Cache
                </BasicButton>
              </div>
            </Tooltip>
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
                disabled={!!nameError}
                onClick={() => {
                  DB.update({ playerName: this.props.name });
                  MessageBar.success("your settings has been saved");
                  this.props.parent().show();
                }}
              >
                Save
              </BasicButton>
            </Grid>
          </Grid>
        </Box>
      </div>
    );
  }
}

export const SettingsActivity = new SettingsActivity_0();
