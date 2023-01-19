import { afterAll, beforeAll, expect, test } from "vitest";
import { Gateway } from "../Gateway";
import { GatewayClient } from "../GatewayClient";

const PORT = 5020;
const DT = 50;

const sleep = async (time: number = DT) =>
  await new Promise((resolve) => setTimeout(resolve, time));

const gateway = new Gateway();
const client = new GatewayClient({
  hostname: "localhost",
  port: PORT,
  gatewayPort: PORT + 1,
});

beforeAll(async () => {
  await gateway.run({
    port: PORT,
    gatewayPort: PORT + 1,
    internalPortRange: [PORT + 2, PORT + 3],
  });
});

afterAll(() => gateway.kill());

test("test_game_flow", async () => {
  const p1 = await client.createMatch({ playerName: "p1" });
  const daemon = gateway.matches.get(p1.matchID);
  await sleep();

  expect(daemon.client.getState().G).toEqual(
    expect.objectContaining({
      daemon: expect.objectContaining({
        players: ["1"],
      }),
      meta: expect.objectContaining({
        players: ["1"],
      }),
    })
  );
  const p2 = await client.joinMatch(p1.matchID, { playerName: "p2" });
  await sleep();

  for (let j = 0; j < 2; ++j) {
    expect(daemon.client.getState().G).toEqual(
      expect.objectContaining({
        daemon: expect.objectContaining({
          players: ["1", "2"],
        }),
        meta: expect.objectContaining({
          host: "1",
          players: ["1", "2"],
        }),
      })
    );
    expect(daemon.client.getState().ctx.phase).toEqual("prepare");
    p1.send("ToggleReady");
    p2.send("ToggleReady");
    await sleep();

    for (let i = 0; i < 12; ++i) {
      let state = daemon.client.getState();
      expect(state.ctx.phase).toEqual("play");
      if (i == 0) {
        p1.send("Redraw");
      }
      p1.send("PlayerMove", { action: "discard", hand: i % 4 });
      p2.send("PlayerMove", { action: "discard", hand: (i + 1) % 4 });
      await sleep();

      state = daemon.client.getState();
      if (i == 0) {
        const [p1, p2] = state.G.game.players;
        expect(p1.hand.concat(p1.deck)).not.toEqual(p2.hand.concat(p2.deck));
      }
      expect(state.ctx.phase).toEqual(i == 11 ? "prepare" : "play");
      expect(state.G.game.round).toEqual(11 - i);
      expect(state.G.buffer).toEqual(
        expect.objectContaining({
          moves: Array(2).fill(null),
          history: Array.from(Array(i + 1).keys()).map((j) => [
            {
              player: 0,
              action: "discard",
              hand: j % 4,
            },
            {
              player: 1,
              action: "discard",
              hand: (j + 1) % 4,
            },
          ]),
        })
      );

      if (i != 11) {
        const [s1, s2] = p1.client.getState().G.game.players!;
        expect(s1.deck).toEqual([]);
        expect(s2.deck).toEqual([]);
        expect(s1.hand).not.toEqual(Array(4).fill(-1));
        expect(s2.hand).toEqual(Array(4).fill(-1));
      }
    }
  }

  p1.stop();
  await sleep();

  expect(daemon.client.getState().G).toEqual(
    expect.objectContaining({
      daemon: expect.objectContaining({
        players: ["2"],
      }),
      meta: expect.objectContaining({
        host: "2",
        players: ["2"],
      }),
    })
  );

  p2.stop();
});

test("test_transfer_host", async () => {
  const p1 = await client.createMatch({ playerName: "p1" });
  const daemon = gateway.matches.get(p1.matchID);
  await sleep();

  p1.send("UpdateMeta", { stage: 3 });
  const p2 = await client.joinMatch(p1.matchID, { playerName: "p2" });
  await sleep();

  expect(daemon.client.getState().G.meta).toEqual(
    expect.objectContaining({
      host: "1",
      stage: 3,
    })
  );
  p2.send("UpdateMeta", { stage: 5 });
  await sleep();

  expect(daemon.client.getState().G.meta).toEqual(
    expect.objectContaining({
      host: "1",
      stage: 3,
    })
  );
  p1.send("UpdateMeta", { host: "2" });
  p1.send("UpdateMeta", { stage: 4 });
  await sleep();

  expect(daemon.client.getState().G.meta).toEqual(
    expect.objectContaining({
      host: "2",
      stage: 3,
    })
  );
  p2.send("UpdateMeta", { stage: 2 });
  await sleep();

  expect(daemon.client.getState().G.meta).toEqual(
    expect.objectContaining({
      host: "2",
      stage: 2,
    })
  );
  p1.stop();
  p2.stop();
});
