import React from "react";
import { ThemeProvider } from "@mui/material";
import { MessageBar } from "./components/MessageBar";
import { Theme } from "./Theme";
import { Window } from "../engine/Window";
import { ActivityPanel } from "./Activity";
import { LoadingBar } from "./components/LoadingBar";

class ControlPanel_0 extends Window {
  renderReact(): React.ReactNode {
    return (
      <ThemeProvider theme={Theme}>
        {/* <SquidDialDialog /> */}
        {ActivityPanel.node}
        {MessageBar.node}
        {LoadingBar.node}
      </ThemeProvider>
    );
  }
}

export const ControlPanel = new ControlPanel_0();
