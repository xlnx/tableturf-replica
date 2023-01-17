import { _ClientImpl } from "boardgame.io/dist/types/src/client/client";
import { Client as BoardGameIOClient } from "boardgame.io/client";
import { SocketIO } from "boardgame.io/multiplayer";
import { MatchController } from "./MatchController";
import { IMatchState } from "./Types";
import loglevel from "loglevel";

const logger = loglevel.getLogger("client");
logger.setLevel("info");

export interface ClientConnectOptions {
  server: string;
  matchID: string;
  playerID: string;
  credentials: string;
  timeout?: number;
}

export class Client {
  readonly client: _ClientImpl<IMatchState>;
  private readonly _start: () => Promise<void>;

  constructor(
    {
      server,
      matchID,
      playerID,
      credentials,
      timeout = 15000,
    }: ClientConnectOptions,
    private readonly onStop: () => Promise<void>
  ) {
    let resolve;
    const task = new Promise<void>((_) => (resolve = _));
    this.client = BoardGameIOClient({
      game: MatchController,
      multiplayer: ({ transportDataCallback, ...transportOpts }) =>
        SocketIO({ server, socketOpts: { timeout } })({
          ...transportOpts,
          transportDataCallback: (data) => {
            transportDataCallback(data);
            if (
              this.client.matchData &&
              this.client.matchData[playerID].isConnected
            ) {
              resolve();
            }
          },
        }),
      matchID,
      playerID,
      credentials,
    });
    this._start = async () => {
      this.client.start();
      await Promise.race([
        task,
        new Promise<void>((_, reject) => setTimeout(reject, timeout)),
      ]);
    };
  }

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
    await this._start();
  }

  async stop() {
    this.client.stop();
    await this.onStop();
  }

  send(method: string, ...args: any[]) {
    if (!(this.client as any).transport.socket) {
      return;
    }
    try {
      logger.log(method, args);
      this.client.moves[method](...args);
    } catch (err) {
      logger.warn(err);
    }
  }
}
