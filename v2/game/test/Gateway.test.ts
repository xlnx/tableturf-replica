import { expect, test } from "vitest";
import { Gateway } from "../src/Gateway";
import { GatewayClient } from "../src/GatewayClient";

const PORT = 5000;

test("test_simple", async () => {
  const gateway = new Gateway();
  await gateway.run({
    port: PORT,
    gatewayPort: PORT + 1,
    internalPortRange: [PORT + 2, PORT + 3],
  });

  const client = new GatewayClient({
    origin: "localhost",
    port: PORT,
    gatewayPort: PORT + 1,
  });

  let response = await client.listMatches();
  expect(response.matches).toHaveLength(0);

  const match1 = await client.createMatch({ playerName: "p1" });
  const { matchID } = match1;
  let match = await client.getMatch(matchID);
  expect(match.players).toEqual([
    expect.objectContaining({ name: "$daemon" }),
    expect.objectContaining({ name: "p1" }),
    { id: 2 },
    { id: 3 },
  ]);

  const match2 = await client.joinMatch(matchID, { playerName: "p2" });
  match = await client.getMatch(match2.matchID);
  expect(match.players).toEqual([
    expect.objectContaining({ name: "$daemon" }),
    expect.objectContaining({ name: "p1" }),
    expect.objectContaining({ name: "p2" }),
    { id: 3 },
  ]);

  await match1.stop();
  match = await client.getMatch(matchID);
  expect(match.players).toEqual([
    expect.objectContaining({ name: "$daemon" }),
    { id: 1, isConnected: false },
    expect.objectContaining({ name: "p2" }),
    { id: 3 },
  ]);

  await match2.stop();

  response = await client.listMatches();
  expect(response.matches).toHaveLength(0);

  gateway.kill();
});
