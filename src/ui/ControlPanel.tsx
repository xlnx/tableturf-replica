import React from "react";
import { ThemeProvider } from "@mui/material";
import { MessageBar } from "./components/MessageBar";
import { Theme } from "./Theme";
import { Window } from "../engine/Window";
import { ActivityPanel } from "./Activity";
import { LoadingDialog } from "./components/LoadingDialog";
import { AlertDialog } from "./components/AlertDialog";

class ControlPanel_0 extends Window {
  renderReact(): React.ReactNode {
    return (
      <ThemeProvider theme={Theme}>
        {/* <SquidDialDialog /> */}
        {ActivityPanel.node}
        {MessageBar.node}
        {LoadingDialog.node}
        {AlertDialog.node}
      </ThemeProvider>
    );
  }
}

export const ControlPanel = new ControlPanel_0();
