import "./Main.less";

import { ControlPanel } from "./ui/ControlPanel";
import { getLogger } from "loglevel";
import { TryOutWindow } from "./ui/TryOutWindow";
import { System } from "./engine/System";
import { WindowManager } from "./engine/WindowManager";
import { GamePlayWindow } from "./ui/GamePlayWindow";
import { DeckEditWindow } from "./ui/DeckEditWindow";
import { InkResetAnimation } from "./ui/InkResetAnimation";
import { RootActivity } from "./ui/activities/RootActivity";
import { MessageBar } from "./ui/components/MessageBar";
import { OnlineViaInviteLinkActivity } from "./ui/activities/OnlineViaInviteLinkActivity";
import { BotViaNetworkActivity } from "./ui/activities/BotViaNetworkActivity";
import { ActivityPanel } from "./ui/Activity";

const logger = getLogger("main");
logger.setLevel("debug");

WindowManager.install({
  name: "Tableturf Replica",
  layers: [
    {
      canvas: true,
      windows: [GamePlayWindow, TryOutWindow, DeckEditWindow],
    },
    {
      canvas: true,
      windows: [InkResetAnimation],
    },
    {
      windows: [ControlPanel],
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
RootActivity.show();

TryOutWindow.show();
ControlPanel.show();

async function main() {
  const connect = System.args.get("connect");
  const url = System.args.get("url");
  const match = System.args.get("match");

  switch (connect) {
    case "bot":
      if (url) {
        await BotViaNetworkActivity.connect(url);
        await ActivityPanel.show();
        return;
      }
      MessageBar.error("not enough parameters: [connect=bot]");
      return;
    case "player":
      if (url) {
        await OnlineViaInviteLinkActivity.connect(url);
        await ActivityPanel.show();
        return;
      }
      if (match) {
        await OnlineViaInviteLinkActivity.connectMatch(match);
        await ActivityPanel.show();
        return;
      }
      MessageBar.error("not enough parameters: [connect=player]");
      return;
  }
}

main().catch((err) => MessageBar.error(err));
