import {
  ClientState,
  _ClientImpl,
} from "boardgame.io/dist/types/src/client/client";
import { Client as BoardGameIOClient } from "boardgame.io/client";
import { SocketIO } from "boardgame.io/multiplayer";
import { MatchController } from "./MatchController";
import loglevel from "loglevel";
import { FilteredMetadata } from "boardgame.io";
import { EventDispatcher } from "./EventDispatcher";

const logger = loglevel.getLogger("client");
logger.setLevel("info");

type Event = "update" | "player-join" | "player-leave";

export interface ClientConnectOptions {
  server: string;
  matchID: string;
  playerID: string;
  credentials: string;
  timeout?: number;
}

export class Client extends EventDispatcher<Event> {
  readonly client: _ClientImpl<IMatchState>;
  private readonly _start: () => Promise<void>;
  private stopped = true;

  protected prevMatchData: FilteredMetadata;
  protected prevState: ClientState<IMatchState>;

  constructor(
    {
      server,
      matchID,
      playerID,
      credentials,
      timeout = 15000,
    }: ClientConnectOptions // private readonly onStop: () => Promise<void>
  ) {
    super();
    let resolve;
    const task = new Promise<void>((_) => (resolve = _));
    this.client = BoardGameIOClient({
      debug: false,
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
    return this.client.playerID;
  }

  get credentials() {
    return this.client.credentials;
  }

  isConnected() {
    return !this.stopped;
  }

  async start() {
    await this._start();
    this.stopped = false;
    this.prevMatchData = this.client.matchData;
    this.prevState = this.client.getState();
    this.client.subscribe(
      (state) => state && setTimeout(() => this.handleUpdate(state))
    );
  }

  stop() {
    this.stopped = true;
    try {
      this.client.stop();
    } catch (e) {}
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

  on(
    event: "update",
    handler: (
      state: ClientState<IMatchState>,
      prevState: ClientState<IMatchState>
    ) => any
  );
  on(event: "player-join", handler: (playerID: string) => any);
  on(event: "player-leave", handler: (playerID: string) => any);

  on(event: Event, handler: any) {
    this.registerEventHandler(event, handler);
  }

  private handleUpdate(state: ClientState<IMatchState>) {
    const { matchData } = this.client;
    // skip daemon
    for (let i = 1; i < this.prevMatchData.length; ++i) {
      const c0 = this.prevMatchData[i].isConnected;
      const c1 = matchData[i].isConnected;
      if (!c0 && c1) {
        // player[i] joined the match
        this.dispatchEvent("player-join", i.toString());
      }
      if (c0 && !c1) {
        // player[i] left the match
        this.dispatchEvent("player-leave", i.toString());
      }
    }
    if (this.prevState != null) {
    }
    this.dispatchEvent("update", state, this.prevState);
    this.prevMatchData = matchData;
    this.prevState = state;
  }
}
