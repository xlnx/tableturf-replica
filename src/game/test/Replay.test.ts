import { expect, test } from "vitest";
import { decodeReplay, encodeReplay } from "../Replay";
// import { Gateway } from "../Gateway";
// import { GatewayClient } from "../GatewayClient";

// const PORT = 5030;

const v1: IMatchReplay = {
  players: ["Player", "Koishi"],
  winner: 1,
  finishReason: "normal",
  startTime: "2023-02-05T11:46:59.845Z",
  finishTime: "",
  stage: 1,
  decks: [
    [55, 6, 92, 22, 56, 137, 45, 141, 52, 159, 13, 34, 103, 40, 28],
    [28, 56, 52, 55, 103, 6, 34, 159, 92, 45, 22, 13, 40, 141, 137],
  ],
  redraws: [
    [],
    [
      {
        hands: [0, 1, 2, 3],
        deck: [137, 28, 45, 103, 6, 34, 159, 22, 55, 13, 52, 92, 141, 56, 40],
      },
    ],
  ],
  moves: [
    [
      {
        action: "trivial",
        hand: 2,
        player: 0,
        params: {
          rotation: 2,
          position: {
            x: 4,
            y: 12,
          },
        },
      },
      {
        action: "trivial",
        hand: 3,
        player: 1,
        params: {
          rotation: 0,
          position: {
            x: 5,
            y: 5,
          },
        },
      },
    ],
    [
      {
        action: "trivial",
        hand: 3,
        player: 0,
        params: {
          rotation: 3,
          position: {
            x: 8,
            y: 8,
          },
        },
      },
      {
        action: "trivial",
        hand: 0,
        player: 1,
        params: {
          rotation: 1,
          position: {
            x: 2,
            y: 8,
          },
        },
      },
    ],
    [
      {
        action: "trivial",
        hand: 3,
        player: 0,
        params: {
          rotation: 1,
          position: {
            x: 8,
            y: 4,
          },
        },
      },
      {
        action: "trivial",
        hand: 1,
        player: 1,
        params: {
          rotation: 3,
          position: {
            x: 2,
            y: 13,
          },
        },
      },
    ],
    [
      {
        action: "trivial",
        hand: 1,
        player: 0,
        params: {
          rotation: 3,
          position: {
            x: 4,
            y: 16,
          },
        },
      },
      {
        action: "trivial",
        hand: 1,
        player: 1,
        params: {
          rotation: 3,
          position: {
            x: 5,
            y: 17,
          },
        },
      },
    ],
    [
      {
        action: "trivial",
        hand: 3,
        player: 0,
        params: {
          rotation: 2,
          position: {
            x: 7,
            y: 13,
          },
        },
      },
      {
        action: "trivial",
        hand: 1,
        player: 1,
        params: {
          rotation: 3,
          position: {
            x: 7,
            y: 0,
          },
        },
      },
    ],
    [
      {
        action: "trivial",
        hand: 1,
        player: 0,
        params: {
          rotation: 1,
          position: {
            x: 8,
            y: 12,
          },
        },
      },
      {
        action: "trivial",
        hand: 2,
        player: 1,
        params: {
          rotation: 2,
          position: {
            x: 2,
            y: 1,
          },
        },
      },
    ],
    [
      {
        action: "trivial",
        hand: 2,
        player: 0,
        params: {
          rotation: 2,
          position: {
            x: 8,
            y: 10,
          },
        },
      },
      {
        action: "trivial",
        hand: 1,
        player: 1,
        params: {
          rotation: 1,
          position: {
            x: 1,
            y: 4,
          },
        },
      },
    ],
    [
      {
        action: "trivial",
        hand: 0,
        player: 0,
        params: {
          rotation: 0,
          position: {
            x: 11,
            y: 5,
          },
        },
      },
      {
        action: "trivial",
        hand: 1,
        player: 1,
        params: {
          rotation: 1,
          position: {
            x: -2,
            y: 15,
          },
        },
      },
    ],
    [
      {
        action: "trivial",
        hand: 0,
        player: 0,
        params: {
          rotation: 3,
          position: {
            x: 11,
            y: 12,
          },
        },
      },
      {
        action: "trivial",
        hand: 2,
        player: 1,
        params: {
          rotation: 1,
          position: {
            x: -2,
            y: 5,
          },
        },
      },
    ],
    [
      {
        player: 0,
        action: "discard",
        hand: 3,
      },
      {
        action: "trivial",
        hand: 0,
        player: 1,
        params: {
          rotation: 1,
          position: {
            x: 4,
            y: -1,
          },
        },
      },
    ],
    [
      {
        action: "special",
        hand: 0,
        player: 0,
        params: {
          rotation: 2,
          position: {
            x: 1,
            y: 12,
          },
        },
      },
      {
        action: "special",
        hand: 3,
        player: 1,
        params: {
          rotation: 2,
          position: {
            x: 7,
            y: 6,
          },
        },
      },
    ],
    [
      {
        player: 0,
        action: "discard",
        hand: 3,
      },
      {
        action: "special",
        hand: 0,
        player: 1,
        params: {
          rotation: 0,
          position: {
            x: 7,
            y: 9,
          },
        },
      },
    ],
  ],
};

test("test_v1", () => {
  const str = encodeReplay(v1);
  console.log(str);
  const replay = decodeReplay(str);
  expect({ ...replay, finishTime: "" }).toEqual(v1);
  expect(() => decodeReplay(str + "wa3s4")).toThrow();
});
