import React from "react";
import { Box, Button, Grid, ThemeProvider } from "@mui/material";
import { MessageBar } from "./MessageBar";
import { ConnectDialog } from "./ConnectDialog";
import { LobbyPanel } from "./LobbyPanel";
import { Theme } from "./Theme";
import { Window } from "../engine/Window";

class ControlPanel_0 extends Window {
  renderReact(): React.ReactNode {
    return (
      <ThemeProvider theme={Theme}>
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
          }}
        >
          <Grid container spacing={1}>
            <Grid item>
              <Button variant="contained" onClick={() => LobbyPanel.toggle()}>
                Lobby
              </Button>
            </Grid>
          </Grid>
        </Box>
        {/* <SquidDialDialog /> */}
        {LobbyPanel.node}
        {MessageBar.node}
        {ConnectDialog.node}
      </ThemeProvider>
    );
  }
}

export const ControlPanel = new ControlPanel_0();
