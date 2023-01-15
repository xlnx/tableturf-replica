import { _ClientImpl } from "boardgame.io/dist/types/src/client/client";
import { Client as BoardGameIOClient } from "boardgame.io/client";
import { SocketIO } from "boardgame.io/multiplayer";
import { TableturfGame, TableturfGameState } from "./Game";
import { GatewayClient } from "./GatewayClient";

type TableturfClient = _ClientImpl<TableturfGameState>;

export interface ClientConnectOptions {
  server: string;
  matchID: string;
  playerID: string;
  credentials: string;
  timeout?: number;
}

async function connect({
  server,
  matchID,
  playerID,
  credentials,
  timeout = 15000,
}: ClientConnectOptions) {
  const task = new Promise<TableturfClient>((resolve) => {
    const client = BoardGameIOClient({
      game: TableturfGame,
      multiplayer: ({ transportDataCallback, ...transportOpts }) =>
        SocketIO({ server, socketOpts: { timeout } })({
          ...transportOpts,
          transportDataCallback: (data) => {
            transportDataCallback(data);
            resolve(client);
          },
        }),
      matchID,
      playerID,
      credentials,
    });
    client.start();
  });
  const timing = new Promise<TableturfClient>((_, reject) =>
    setTimeout(reject, timeout)
  );
  return Promise.race([task, timing]);
}

export class Client {
  protected client: TableturfClient;

  constructor(
    private readonly options: ClientConnectOptions,
    private readonly onStop: () => Promise<void>
  ) {}

  get matchID() {
    return this.client.matchID;
  }

  get playerID() {
    return +this.client.playerID;
  }

  get credentials() {
    return this.client.credentials;
  }

  async start() {
    this.client = await connect(this.options);
  }

  async stop() {
    this.client.stop();
    await this.onStop();
  }
}
