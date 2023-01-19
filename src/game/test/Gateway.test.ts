import { expect, test } from "vitest";
import { Gateway } from "../Gateway";
import { GatewayClient } from "../GatewayClient";

const PORT = 5030;

test("test_simple", async () => {
  const gateway = new Gateway();
  await gateway.run({
    port: PORT,
    gatewayPort: PORT + 1,
    internalPortRange: [PORT + 2, PORT + 3],
  });

  const client = new GatewayClient({
    hostname: "localhost",
    port: PORT,
    gatewayPort: PORT + 1,
  });

  let response = await client.listMatches();
  expect(response.matches).toHaveLength(0);

  const match1 = await client.createMatch({ playerName: "p1" });
  const { matchID } = match1;
  let match = await client.getMatch(matchID);
  expect(match.players).toEqual([
    expect.objectContaining({ name: "$daemon", isConnected: true }),
    expect.objectContaining({ name: "p1", isConnected: true }),
    { id: 2 },
    { id: 3 },
    { id: 4 },
  ]);

  const match2 = await client.joinMatch(matchID, { playerName: "p2" });
  match = await client.getMatch(match2.matchID);
  expect(match.players).toEqual([
    expect.objectContaining({ name: "$daemon", isConnected: true }),
    expect.objectContaining({ name: "p1", isConnected: true }),
    expect.objectContaining({ name: "p2", isConnected: true }),
    { id: 3 },
    { id: 4 },
  ]);

  match1.stop();
  await new Promise((resolve) => setTimeout(resolve, 500));

  match = await client.getMatch(matchID);
  expect(match.players).toEqual([
    expect.objectContaining({ name: "$daemon", isConnected: true }),
    expect.objectContaining({ isConnected: false }),
    expect.objectContaining({ name: "p2", isConnected: true }),
    { id: 3 },
    { id: 4 },
  ]);

  match2.client.stop();
  await new Promise((resolve) => setTimeout(resolve, 500));

  response = await client.listMatches();
  expect(response.matches).toHaveLength(0);

  gateway.kill();
});
