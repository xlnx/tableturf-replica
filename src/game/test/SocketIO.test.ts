import { expect, test, vi } from "vitest";
import { Client, LobbyClient } from "boardgame.io/client";
import { Origins, Server } from "boardgame.io/server";
import { SocketIO } from "boardgame.io/multiplayer";
import { MatchController } from "../MatchController";
import { v4 } from "uuid";

const PORT = 5010;

const mock = {
  generateCredentials: () => {
    return v4();
  },
  authenticateCredentials: (credentials, metadata) => {
    if (credentials && metadata) {
      return metadata.credentials == credentials;
    }
    return false;
  },
};

const spy = {
  generateCredentials: vi.spyOn(mock, "generateCredentials"),
  authenticateCredentials: vi.spyOn(mock, "authenticateCredentials"),
};

test("test_socketio_usage", async () => {
  const server = Server({
    games: [MatchController],
    origins: [Origins.LOCALHOST_IN_DEVELOPMENT],
    generateCredentials: mock.generateCredentials,
    authenticateCredentials: mock.authenticateCredentials,
  });
  const serverInstance = await server.run({ port: PORT });
  const lobby = new LobbyClient({ server: `http://localhost:${PORT}` });

  // list games
  const games = await lobby.listGames();
  expect(games).toEqual(["tableturf"]);

  // create match
  const { matchID } = await lobby.createMatch(games[0], { numPlayers: 2 });
  let matches = (await lobby.listMatches(games[0])).matches;
  expect(matches).toHaveLength(1);
  expect(matches[0].matchID).toEqual(matchID);
  expect(matches[0].gameName).toEqual(games[0]);
  expect(spy.generateCredentials).not.toHaveBeenCalled();
  expect(spy.authenticateCredentials).not.toHaveBeenCalled();

  // join match
  const playerName = "player";
  const playerData = { data: [{ my: "data" }] };
  const { playerID, playerCredentials } = await lobby.joinMatch(
    games[0],
    matchID,
    { playerName, data: playerData }
  );
  expect(spy.generateCredentials).toHaveBeenCalledOnce();
  expect(spy.authenticateCredentials).not.toHaveBeenCalled();

  matches = (await lobby.listMatches(games[0])).matches;
  expect(matches).toHaveLength(1);
  expect(matches[0].players).toEqual([
    expect.objectContaining({
      id: 0,
      name: playerName,
      data: playerData,
    }),
    expect.objectContaining({
      id: 1,
    }),
  ]);

  const client = Client({
    game: MatchController,
    multiplayer: SocketIO({ server: `localhost:${PORT}` }),
    playerID,
    matchID,
    credentials: playerCredentials,
  });
  client.start();
  client.subscribe((state) => {
    if (state) {
      expect(spy.generateCredentials).toHaveBeenCalledOnce();
      expect(spy.authenticateCredentials).toHaveBeenCalledWith(
        playerCredentials,
        expect.anything()
      );
    }
  });

  // leave match
  await lobby.leaveMatch(games[0], matchID, {
    playerID,
    credentials: playerCredentials,
  });
  matches = (await lobby.listMatches(games[0])).matches;
  expect(matches).toHaveLength(0);

  await new Promise((resolve) => setTimeout(resolve, 1000));
  server.kill(serverInstance);
});
