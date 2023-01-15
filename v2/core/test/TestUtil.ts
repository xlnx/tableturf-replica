import { expect } from "vitest";
import { getCardById, getStageById, getBoardState } from "../src/Api";
import stripIndent from "strip-indent";
import { rectFromString, rectToString } from "../src/Utils";
import { IRect } from "../src/Types";

export const TestUtil = {
  stage: {
    BoxSeats: getStageById(0),
    DoubleGemini: getStageById(1),
    LakefrontProperty: getStageById(2),
    MainStreet: getStageById(3),
    RiverDrift: getStageById(4),
    SquareSquared: getStageById(5),
    ThunderPoint: getStageById(6),
    XMarksTheGarden: getStageById(7),
  },

  board: {
    BoxSeats: getBoardState(getStageById(0).board),
    DoubleGemini: getBoardState(getStageById(1).board),
    LakefrontProperty: getBoardState(getStageById(2).board),
    MainStreet: getBoardState(getStageById(3).board),
    RiverDrift: getBoardState(getStageById(4).board),
    SquareSquared: getBoardState(getStageById(5).board),
    ThunderPoint: getBoardState(getStageById(6).board),
    XMarksTheGarden: getBoardState(getStageById(7).board),
  },

  card: {
    BurstBomb: getCardById(58),
    SplatBomb: getCardById(56),
    Torpedo: getCardById(69),
    PointSensor: getCardById(65),
    Nautilus: getCardById(43),
    InkStorm: getCardById(74),
  },

  parseBoard: (str: string) => {
    const rect = rectFromString(str);
    return getBoardState(rect);
  },

  expectRectEqual(actual: IRect, expected: string) {
    expect(rectToString(actual).trim()).toEqual(stripIndent(expected).trim());
  },
};
