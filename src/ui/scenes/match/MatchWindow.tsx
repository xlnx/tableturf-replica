import { Window } from "../../../engine/Window";
import { ColorPalette } from "../../ColorPalette";
import { getLogger } from "loglevel";
import { ReactNode } from "react";
import { Box, ThemeProvider } from "@mui/material";
import { Theme } from "../../Theme";
import { Match } from "../../../game/Match";
import { PlayerPanel } from "./PlayerPanel";
import { SpectatorPanel } from "./SpectatorPanel";
import { GUI } from "./GUI";

const logger = getLogger("game-play");
logger.setLevel("info");

class MatchWindow_0 extends Window {
  private readonly gui: GUI;

  private readonly playerPanel = new PlayerPanel();
  private readonly spectatorPanel = new SpectatorPanel();

  constructor() {
    super({
      bgTint: ColorPalette.Main.bg.primary,
    });

    this.gui = new GUI(this);
    this.layout = this.gui.layout;
    this.playerPanel.update({ gui: this.gui });
    this.spectatorPanel.update({ gui: this.gui });
  }

  protected renderReact(): ReactNode {
    return (
      <ThemeProvider theme={Theme}>
        {this.gui.render()}
        {this.playerPanel.node}
        {this.spectatorPanel.node}
      </ThemeProvider>
    );
  }

  bind(match: Match) {
    this.gui.match = match;
    this.playerPanel.bind(match);
    this.spectatorPanel.bind(match);
  }
}

export const MatchWindow = new MatchWindow_0();
