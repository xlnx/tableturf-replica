import { expect, test } from "vitest";
import { moveBoard, isBoardMoveValid, CardPlacement } from "../Tableturf";
import { TestUtil } from "./TestUtil";

test("simple", () => {
  let stage = TestUtil.stage.BoxSeats;
  expect(stage.board.size[0]).toEqual(10);
  expect(stage.board.size[1]).toEqual(10);
  expect(stage.count.area).toEqual(100);

  stage = TestUtil.stage.DoubleGemini;
  expect(stage.board.size[0]).toEqual(17);
  expect(stage.board.size[1]).toEqual(25);
  expect(stage.count.area).toEqual(249);

  stage = TestUtil.stage.LakefrontProperty;
  expect(stage.board.size[0]).toEqual(16);
  expect(stage.board.size[1]).toEqual(16);
  expect(stage.count.area).toEqual(240);

  stage = TestUtil.stage.MainStreet;
  expect(stage.board.size[0]).toEqual(9);
  expect(stage.board.size[1]).toEqual(26);
  expect(stage.count.area).toEqual(234);

  stage = TestUtil.stage.RiverDrift;
  expect(stage.board.size[0]).toEqual(17);
  expect(stage.board.size[1]).toEqual(25);
  expect(stage.count.area).toEqual(245);

  stage = TestUtil.stage.SquareSquared;
  expect(stage.board.size[0]).toEqual(15);
  expect(stage.board.size[1]).toEqual(15);
  expect(stage.count.area).toEqual(225);

  stage = TestUtil.stage.ThunderPoint;
  expect(stage.board.size[0]).toEqual(16);
  expect(stage.board.size[1]).toEqual(22);
  expect(stage.count.area).toEqual(240);

  stage = TestUtil.stage.XMarksTheGarden;
  expect(stage.board.size[0]).toEqual(19);
  expect(stage.board.size[1]).toEqual(23);
  expect(stage.count.area).toEqual(245);
});

test("move_0", () => {
  let actual = moveBoard(TestUtil.board.BoxSeats, [
    {
      player: 0,
      card: TestUtil.card.Nautilus.id,
      rotation: 0,
      position: { x: -1, y: -2 },
    },
  ]);
  TestUtil.expectRectEqual(
    actual,
    `
    aa........
    aa........
    aaaaA..B..
    ..........
    ..........
    ..........
    ..........
    ..A.......
    ..........
    ..........
    `
  );
  expect(actual.count.special[0]).toEqual(0);
  expect(actual.count.special[0]).toEqual(0);
});

test("move_1", () => {
  let actual = moveBoard(TestUtil.board.BoxSeats, [
    {
      player: 0,
      card: TestUtil.card.Nautilus.id,
      rotation: 0,
      position: { x: 2, y: -2 },
    },
  ]);
  TestUtil.expectRectEqual(
    actual,
    `
    ...aa.....
    ...aa.....
    ...aaaaA..
    ..........
    ..........
    ..........
    ..........
    ..A.......
    ..........
    ..........
    `
  );
  expect(actual.count.special[0]).toEqual(0);
  expect(actual.count.special[1]).toEqual(0);
});

test("move_2", () => {
  let actual = moveBoard(TestUtil.board.BoxSeats, [
    {
      player: 0,
      card: TestUtil.card.Nautilus.id,
      rotation: 1,
      position: { x: 4, y: -1 },
    },
  ]);
  TestUtil.expectRectEqual(
    actual,
    `
    .......aaa
    .......aaa
    .......B..
    .......a..
    .......A..
    ..........
    ..........
    ..A.......
    ..........
    ..........
    `
  );
  expect(actual.count.special[0]).toEqual(0);
  expect(actual.count.special[1]).toEqual(0);
});

test("move_3", () => {
  let actual = moveBoard(TestUtil.board.BoxSeats, [
    {
      player: 0,
      card: TestUtil.card.Nautilus.id,
      rotation: 1,
      position: { x: -1, y: 3 },
    },
  ]);
  TestUtil.expectRectEqual(
    actual,
    `
    ..........
    ..........
    .......B..
    ..........
    ..aaa.....
    ..aaa.....
    ..a.......
    ..A.......
    ..A.......
    ..........
    `
  );
  expect(actual.count.special[0]).toEqual(0);
  expect(actual.count.special[1]).toEqual(0);

  actual = moveBoard(actual, [
    {
      player: 1,
      card: TestUtil.card.Nautilus.id,
      rotation: 0,
      position: { x: 0, y: 0 },
    },
  ]);
  TestUtil.expectRectEqual(
    actual,
    `
    ..........
    ..........
    .bb....B..
    .bb.......
    .bbbbB....
    ..aaa.....
    ..a.......
    ..A.......
    ..A.......
    ..........
    `
  );
  expect(actual.count.special[0]).toEqual(0);
  expect(actual.count.special[1]).toEqual(0);

  actual = moveBoard(actual, [
    {
      player: 0,
      card: TestUtil.card.PointSensor.id,
      rotation: 0,
      position: { x: -1, y: 0 },
    },
  ]);
  TestUtil.expectRectEqual(
    actual,
    `
    ..........
    ..........
    .aba...B..
    .bA.......
    .ababB....
    ..aaa.....
    ..a.......
    ..A.......
    ..A.......
    ..........
    `
  );
  expect(actual.count.special[0]).toEqual(0);
  expect(actual.count.special[1]).toEqual(0);
});

test("move_4", () => {
  let actual = moveBoard(TestUtil.board.ThunderPoint, [
    {
      player: 0,
      card: TestUtil.card.Nautilus.id,
      rotation: 0,
      position: { x: -2, y: 4 },
    },
  ]);
  TestUtil.expectRectEqual(
    actual,
    `
    @@@@@@@@........
    @@@@@@@@........
    @@@@@@@@........
    @@@@@@@@....B...
    @@@@@@@@........
    @@@@@@@@........
    @@@@@@@@........
    a...............
    aaaA............
    ................
    ................
    ................
    ................
    ................
    ................
    ........@@@@@@@@
    ........@@@@@@@@
    ........@@@@@@@@
    ...A....@@@@@@@@
    ........@@@@@@@@
    ........@@@@@@@@
    ........@@@@@@@@
    `
  );
  expect(actual.count.special[0]).toEqual(0);
  expect(actual.count.special[1]).toEqual(0);
});

test("move_simultaneously_0", () => {
  let actual = moveBoard(TestUtil.board.BoxSeats, [
    {
      player: 0,
      card: TestUtil.card.Nautilus.id,
      rotation: 0,
      position: { x: -1, y: -2 },
    },
    {
      player: 1,
      card: TestUtil.card.Nautilus.id,
      rotation: 0,
      position: { x: -1, y: -2 },
    },
  ]);
  TestUtil.expectRectEqual(
    actual,
    `
    ##........
    ##........
    #####..B..
    ..........
    ..........
    ..........
    ..........
    ..A.......
    ..........
    ..........
    `
  );
  expect(actual.count.special[0]).toEqual(0);
  expect(actual.count.special[1]).toEqual(0);
});

test("move_simultaneously_1", () => {
  let actual = moveBoard(TestUtil.board.BoxSeats, [
    {
      player: 0,
      card: TestUtil.card.Nautilus.id,
      rotation: 0,
      position: { x: -1, y: -2 },
    },
    {
      player: 1,
      card: TestUtil.card.Nautilus.id,
      rotation: 0,
      position: { x: 0, y: -2 },
    },
  ]);
  TestUtil.expectRectEqual(
    actual,
    `
    a#b.......
    a#b.......
    a###AB.B..
    ..........
    ..........
    ..........
    ..........
    ..A.......
    ..........
    ..........
    `
  );
  expect(actual.count.special[0]).toEqual(0);
  expect(actual.count.special[1]).toEqual(0);
});

test("validate_move_0", () => {
  let board = TestUtil.parseBoard(`
    @@.....aaa
    a@.....aaa
    b......aaa
    B......aAa
    b......aaa
    ..........
    ..........
    ..........
    ........@@
    ........@@
  `);
  expect(board.count.special[0]).toEqual(1);
  expect(board.count.special[1]).toEqual(0);

  let move: CardPlacement = {
    player: 0,
    card: TestUtil.card.Nautilus.id,
    rotation: 0,
    position: { x: 0, y: -1 },
  };
  expect(isBoardMoveValid(board, move, false)).toBe(false);

  move.position.y = 1;
  expect(isBoardMoveValid(board, move, false)).toBe(false);

  move.position.y = 0;
  expect(isBoardMoveValid(board, move, false)).toBe(true);

  move.position.x = 1;
  expect(isBoardMoveValid(board, move, false)).toBe(true);

  move.position.x = 2;
  expect(isBoardMoveValid(board, move, false)).toBe(false);

  move.position.y = 1;
  expect(isBoardMoveValid(board, move, false)).toBe(true);
});

test("validate_move_1", () => {
  let board = TestUtil.parseBoard(`
    @@....abaB
    A@....abab
    b.....abBb
    B.....abAb
    b.....abab
    ..........
    ..........
    ..........
    ........@@
    ........@@
  `);
  expect(board.count.special[0]).toEqual(1);
  expect(board.count.special[1]).toEqual(2);

  let move: CardPlacement = {
    player: 0,
    card: TestUtil.card.Nautilus.id,
    rotation: 0,
    position: { x: 0, y: -1 },
  };
  expect(isBoardMoveValid(board, move, true)).toBe(false);

  move.position.y = 1;
  expect(isBoardMoveValid(board, move, true)).toBe(false);

  move.position.y = 0;
  expect(isBoardMoveValid(board, move, true)).toBe(true);

  move.position.x = 1;
  expect(isBoardMoveValid(board, move, true)).toBe(false);

  move.position.x = 2;
  expect(isBoardMoveValid(board, move, true)).toBe(true);

  move.position.y = -1;
  expect(isBoardMoveValid(board, move, true)).toBe(true);

  move.position.x = 3;
  expect(isBoardMoveValid(board, move, true)).toBe(false);

  move.position.y = -2;
  expect(isBoardMoveValid(board, move, true)).toBe(false);
});
