import React from "react";
import { ThemeProvider } from "@mui/material";
import { MessageBar } from "./components/MessageBar";
import { Theme } from "./Theme";
import { Window } from "../engine/Window";
import { ActivityPanel } from "./Activity";
import { LoadingScreen } from "./components/LoadingScreen";

class ControlPanel_0 extends Window {
  renderReact(): React.ReactNode {
    return (
      <ThemeProvider theme={Theme}>
        {/* <SquidDialDialog /> */}
        {ActivityPanel.node}
        {MessageBar.node}
        {LoadingScreen.node}
      </ThemeProvider>
    );
  }
}

export const ControlPanel = new ControlPanel_0();
