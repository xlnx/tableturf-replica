import { Window } from "../../../engine/Window";
import { ColorPalette } from "../../ColorPalette";
import { getLogger } from "loglevel";
import { ReactNode } from "react";
import { ThemeProvider } from "@mui/material";
import { Theme } from "../../Theme";
import { Match } from "../../../game/Match";
import { PlayerPanel } from "./PlayerPanel";
import { SpectatorPanel } from "./SpectatorPanel";
import { GUI } from "./GUI";
import { ReplayPanel } from "./ReplayPanel";

const logger = getLogger("game-play");
logger.setLevel("info");

class MatchWindow_0 extends Window {
  readonly gui: GUI;

  readonly playerPanel = new PlayerPanel();
  readonly spectatorPanel = new SpectatorPanel();
  readonly replayPanel = new ReplayPanel();

  constructor() {
    super({
      bgTint: ColorPalette.Main.bg.primary,
    });

    this.gui = new GUI(this);
    this.layout = this.gui.layout;
    this.playerPanel.update({ gui: this.gui });
    this.spectatorPanel.update({ gui: this.gui });
    this.replayPanel.update({ gui: this.gui });

    window.addEventListener("contextmenu", (evt) => {
      // rough detection of right button
      if (this.ui.visible && evt.button == 2) {
        this.gui.board.uiRotateInput(1);
      }
    });
  }

  protected renderReact(): ReactNode {
    return (
      <ThemeProvider theme={Theme}>
        {this.gui.render()}
        {this.playerPanel.node}
        {this.spectatorPanel.node}
        {this.replayPanel.node}
      </ThemeProvider>
    );
  }

  async bind(e: Match | IMatchReplay) {
    const match = e instanceof Match ? e : null;
    const replay = !(e instanceof Match) ? e : null;
    this.gui.bind(match);
    this.playerPanel.bind(match);
    this.spectatorPanel.bind(match);
    await this.replayPanel.bind(replay);
  }
}

export const MatchWindow = new MatchWindow_0();
