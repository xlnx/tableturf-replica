import { afterAll, beforeAll, expect, test } from "vitest";
import { Gateway } from "../Gateway";
import { GatewayClient } from "../GatewayClient";
import { MatchDriver } from "../MatchDriver";
import { Match } from "../Match";
import { StarterDeck } from "../MatchController";

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

  const d1 = new MockMatchDriver(p1);
  const d2 = new MockMatchDriver(p1);

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
    p2.send("ToggleReady");
    await sleep();
    p1.send("ToggleReady");
    await sleep();

    const state = daemon.client.getState();
    expect(state.ctx.phase).toEqual("handshake");
    p1.send("Handshake", { deck: StarterDeck.slice() });
    p2.send("Handshake", { deck: StarterDeck.slice() });
    await sleep();

    for (let i = 0; i < 12; ++i) {
      let state = daemon.client.getState();
      expect(state.ctx.phase).toEqual("play");

      p1.send("PlayerMove", { action: "discard", hand: i % 4 });
      await sleep();

      if (i == 0) {
        p2.send("Redraw");
      }

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
          prevMoves: [
            {
              player: 0,
              action: "discard",
              hand: i % 4,
            },
            {
              player: 1,
              action: "discard",
              hand: (i + 1) % 4,
            },
          ],
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

    const li = [expect.objectContaining({ event: "start" })];
    for (let i = 0; i < 12; ++i) {
      li.push(expect.objectContaining({ event: "round", args: [12 - i] }));
      li.push(
        expect.objectContaining({
          event: "move",
          args: [p1.playerID, expect.anything()],
        })
      );
      if (i == 0) {
        li.push(
          expect.objectContaining({ event: "redraw", args: [p2.playerID] })
        );
      }
      li.push(
        expect.objectContaining({
          event: "move",
          args: [p2.playerID, expect.anything()],
        })
      );
    }
    li.push(
      expect.objectContaining({
        event: "finish",
        args: [
          expect.objectContaining({
            winner: null,
            finishReason: "normal",
          }),
        ],
      })
    );

    expect(d1.events).toEqual(li);
    expect(d2.events).toEqual(li);

    [d1, d2].forEach((driver) => driver.events.splice(0, driver.events.length));
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

test("test_give_up", async () => {
  const p1 = await client.createMatch({ playerName: "p1" });
  const daemon = gateway.matches.get(p1.matchID);
  await sleep();
  const p2 = await client.joinMatch(p1.matchID, { playerName: "p2" });
  await sleep();

  const d1 = new MockMatchDriver(p1);
  const d2 = new MockMatchDriver(p1);

  for (let j = 0; j < 2; ++j) {
    expect(daemon.client.getState().ctx.phase).toEqual("prepare");
    p2.send("ToggleReady");
    await sleep();
    p1.send("ToggleReady");
    await sleep();

    let state = daemon.client.getState();
    expect(state.ctx.phase).toEqual("handshake");
    p1.send("Handshake", { deck: StarterDeck.slice() });
    p2.send("Handshake", { deck: StarterDeck.slice() });
    await sleep();

    state = daemon.client.getState();
    expect(state.ctx.phase).toEqual("play");
    p1.send("PlayerMove", { action: "discard", hand: 0 });
    await sleep();

    p2.send("GiveUp");
    await sleep();

    state = daemon.client.getState();
    expect(state.ctx.phase).toEqual("prepare");

    const li = [
      expect.objectContaining({ event: "start" }),
      expect.objectContaining({ event: "round", args: [12] }),
      expect.objectContaining({
        event: "move",
        args: [p1.playerID, expect.anything()],
      }),
      expect.objectContaining({
        event: "finish",
        args: [
          expect.objectContaining({
            winner: 0,
            finishReason: "giveup",
          }),
        ],
      }),
    ];

    expect(d1.events).toEqual(li);
    expect(d2.events).toEqual(li);

    [d1, d2].forEach((driver) => driver.events.splice(0, driver.events.length));
  }

  p1.stop();
  p2.stop();
});

test("test_tle", async () => {
  const p1 = await client.createMatch({ playerName: "p1" });
  const daemon = gateway.matches.get(p1.matchID);
  await sleep();

  p1.send("UpdateMeta", { turnTimeQuotaSec: 0.5 });
  await sleep();

  const p2 = await client.joinMatch(p1.matchID, { playerName: "p2" });
  await sleep();

  const d1 = new MockMatchDriver(p1);
  const d2 = new MockMatchDriver(p1);

  for (let j = 0; j < 2; ++j) {
    expect(daemon.client.getState().ctx.phase).toEqual("prepare");
    p2.send("ToggleReady");
    await sleep();
    p1.send("ToggleReady");
    await sleep();

    let state = daemon.client.getState();
    expect(state.ctx.phase).toEqual("handshake");
    p1.send("Handshake", { deck: StarterDeck.slice() });
    p2.send("Handshake", { deck: StarterDeck.slice() });
    await sleep();

    if (j == 0) {
      state = daemon.client.getState();
      expect(state.ctx.phase).toEqual("play");
      p1.send("PlayerMove", { action: "discard", hand: 0 });
      await sleep();
    }

    // tle
    await sleep(1000);

    state = daemon.client.getState();
    expect(state.ctx.phase).toEqual("prepare");

    const li = [
      expect.objectContaining({ event: "start" }),
      expect.objectContaining({ event: "round", args: [12] }),
      ...(j == 0
        ? [
            expect.objectContaining({
              event: "move",
              args: [p1.playerID, expect.anything()],
            }),
          ]
        : []),
      expect.objectContaining({
        event: "finish",
        args: [
          expect.objectContaining({
            winner: j == 0 ? 0 : null,
            finishReason: "tle",
          }),
        ],
      }),
    ];

    expect(d1.events).toEqual(li);
    expect(d2.events).toEqual(li);

    [d1, d2].forEach((driver) => driver.events.splice(0, driver.events.length));
  }

  p1.stop();
  p2.stop();
});

class MockMatchDriver extends MatchDriver {
  readonly events: any[] = [];

  constructor(match: Match) {
    super(match);
    for (const event of [
      "start",
      "round",
      "redraw",
      "move",
      "finish",
      "abort",
    ]) {
      this.on(event as any, this.emitEvent.bind(this, event));
    }
  }

  private emitEvent(event: string, ...args: any[]) {
    this.events.push({ event, args });
  }
}
