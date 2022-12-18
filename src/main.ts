import "./Main.less";

import { Lobby } from "./Lobby";
import { ControlPanel } from "./ui/ControlPanel";
import { getLogger } from "loglevel";
import { TryOutWindow } from "./ui/TryOutWindow";
import { System } from "./engine/System";
import { WindowManager } from "./engine/WindowManager";
import { GamePlayWindow } from "./ui/GamePlayWindow";
import { DeckEditWindow } from "./ui/DeckEditWindow";
import { InkResetAnimation } from "./ui/InkResetAnimation";
import { RootActivity } from "./ui/activities/RootActivity";

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

RootActivity.show();

TryOutWindow.show();
ControlPanel.show();

const peer = System.args.get("peer");
if (peer) {
  logger.log(`connecting peer: ${peer}`);
  try {
    await Lobby.connectP2P(peer, 30);
  } catch (err) {
    logger.log(err);
  }
}

// import "./Main.less";

// import { getLogger } from "loglevel";
// import { WindowManager } from "./engine/WindowManager";
// import { TestWindow } from "./ui/TestWindow";

// const logger = getLogger("main");
// logger.setLevel("debug");

// WindowManager.install({
//   name: "Tableturf Replica",
//   layers: [
//     {
//       windows: [TestWindow],
//     },
//   ],
// });

// TestWindow.show();
