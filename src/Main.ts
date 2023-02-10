// install wm first
import "./engine/WindowManager";

import "./Main.less";

import { ControlPanel } from "./ui/ControlPanel";
import { getLogger } from "loglevel";
import { EntryWindow } from "./ui/scenes/entry/EntryWindow";
import { System } from "./engine/System";
import { WindowManager } from "./engine/WindowManager";
import { MatchWindow } from "./ui/scenes/match/MatchWindow";
import { InkResetAnimation } from "./ui/InkResetAnimation";
import { RootActivity } from "./ui/activities/RootActivity";
import { MessageBar } from "./ui/components/MessageBar";
import { JoinMatchActivity } from "./ui/activities/JoinMatchActivity";
import { ActivityPanel } from "./ui/Activity";
import { getCardById } from "./core/Tableturf";
import { DeckPanel } from "./ui/scenes/entry/DeckPanel";
import { MatchActivity } from "./ui/activities/MatchActivity";
import { ReplayActivity } from "./ui/activities/ReplayActivity";

const logger = getLogger("main");
logger.setLevel("debug");

WindowManager.install({
  name: "Tableturf Replica",
  layers: [
    {
      canvas: true,
      windows: [MatchWindow, EntryWindow],
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

EntryWindow.show();
ControlPanel.show();

async function main() {
  const deck = System.args.get("deck");
  const connect = System.args.get("connect");
  const url = System.args.get("url");
  const match = System.args.get("match");
  const replay = System.args.get("replay");

  if (deck) {
    const cards: number[] = JSON.parse(deck);
    if (!cards.every((card) => getCardById(card))) {
      MessageBar.error(`invalid deck: ${cards}`);
      return;
    }
    await DeckPanel.update({ deck: -1, cards });
    MessageBar.success(`imported deck: ${cards}`);
    await DeckPanel.edit();
    return;
  }

  if (replay) {
    await ReplayActivity.loadReplay(replay);
    return;
  }

  switch (connect) {
    // case "bot":
    //   if (url) {
    //     await BotViaNetworkActivity.connect(url);
    //     await ActivityPanel.show();
    //     return;
    //   }
    //   MessageBar.error("not enough parameters: [connect=bot]");
    //   return;
    case "player":
      if (url) {
        await JoinMatchActivity.connect(url);
        await ActivityPanel.show();
        return;
      }
      if (match) {
        await MatchActivity.joinMatch(match);
        await ActivityPanel.show();
        return;
      }
      MessageBar.error("not enough parameters: [connect=player]");
      return;
  }
}

main().catch((err) => MessageBar.error(err));
