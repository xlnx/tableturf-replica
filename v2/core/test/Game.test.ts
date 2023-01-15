import { expect, test } from "vitest";
import { initGame, moveGame } from "../src/Api";
import GameRecord_0 from "./testdata/record_0.json";
import { TestUtil } from "./TestUtil";

test("test_simple", () => {
  const { stage, decks, moves } = GameRecord_0;
  let game = initGame(stage, decks);
  for (const li of moves) {
    game = moveGame(
      game,
      li.map((e, i) => <any>{ ...e, player: i })
    );
  }
  TestUtil.expectRectEqual(
    game.board,
    `
    @@@@@@@@..B.bbb.
    @@@@@@@@...bbbbb
    @@@@@@@@bbbbbbb.
    @@@@@@@@bbbBBb..
    @@@@@@@@bbAab...
    @@@@@@@@bBaabbb.
    @@@@@@@@baabbbbb
    .aaa.abAaaabBbBb
    aaAbbaAaaaaaBb.b
    aabbbbBbbaa..bb.
    ..bbbb..aBbaBb..
    .aAbbaaabbbb.b..
    aaaa.aa.aab.bbb.
    aa...aaaAa...bbb
    a.a.aaaaa.a..B..
    aAaaaAaa@@@@@@@@
    aaaa.a.a@@@@@@@@
    aaaaaaa.@@@@@@@@
    ..AAaa..@@@@@@@@
    ..aaaaa.@@@@@@@@
    aaaaaaa.@@@@@@@@
    ..A.....@@@@@@@@
    `
  );
  expect(game.players[0].count.special).toBe(0);
  expect(game.players[1].count.special).toBe(2);
  expect(game.board.count.area).toStrictEqual([96, 79]);
});
