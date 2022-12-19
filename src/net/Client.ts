import { Client as ClientImpl } from "boardgame.io/client";
import { _ClientImpl } from "boardgame.io/dist/types/src/client/client";
import {
  Transport,
  TransportOpts,
} from "boardgame.io/dist/types/src/client/transport/transport";
import { getLogger } from "loglevel";
import {
  TableturfClientState,
  TableturfGame,
  TableturfGameState,
  TableturfPlayerInfo,
} from "../Game";
import { DB } from "../Database";

const logger = getLogger("client");
logger.setLevel("info");

type State = TableturfClientState;
type LogEntry = any;

type FilteredMetadata = {
  id: number;
  name?: string;
  isConnected?: boolean;
}[];

type SyncInfo = {
  state: State;
  filteredMetadata: FilteredMetadata;
  initialState: State;
  log: LogEntry[];
};

export type TransportData =
  | {
      type: "update";
      args: [string, State, LogEntry[]];
    }
  | {
      type: "sync";
      args: [string, SyncInfo];
    }
  | {
      type: "matchData";
      args: [string, FilteredMetadata];
    };

type ClientUpdateHandler = (
  state: TableturfClientState,
  prevState: TableturfClientState
) => void;

type ClientDataHandler = (data: TransportData) => void;

interface ClientOptions {
  playerId: PlayerId;
  matchId: string;
  credentials?: string;
  multiplayer: (_: TransportOpts) => Transport;
}

let _current: Client = null;

export class Client {
  public readonly client: _ClientImpl<TableturfGameState>;
  public readonly playerId: PlayerId;
  public readonly matchId: string;

  private readonly _detachStateUpdateListener: () => void;
  private _connectHandler: () => void = () => {};
  private _isConnected: boolean = false;
  private _prevState: TableturfClientState = null;
  private _updateHandlers: ClientUpdateHandler[] = [];
  private _dataHandlers: ClientDataHandler[] = [];

  constructor({ multiplayer, playerId, matchId, ...opts }: ClientOptions) {
    this.playerId = playerId;
    this.matchId = matchId;
    this.client = ClientImpl({
      ...opts,
      debug: false,
      numPlayers: 2,
      game: TableturfGame,
      playerID: playerId.toString(),
      matchID: matchId,
      multiplayer: ({ transportDataCallback, ...transportOpts }) =>
        multiplayer({
          ...transportOpts,
          transportDataCallback: (data) => {
            transportDataCallback(data);
            try {
              this.handleTransportData(<any>data);
            } catch (err) {
              logger.warn(err);
            }
          },
        }),
    });
    this._detachStateUpdateListener = this.client.subscribe((s) => {
      if (!!s) {
        this.handleStateUpdate(s);
      }
    });
  }

  /**
   * @param  {number} timeout - connection timeout in seconds
   * @returns Promise
   */
  async start(timeout: number): Promise<this> {
    const task = new Promise<void>((resolve) => {
      this._connectHandler = resolve;
    });
    const timing = new Promise<void>((_, reject) =>
      setTimeout(reject, 1000 * timeout)
    );
    this.client.start();
    return Promise.race([task, timing])
      .then(() => {
        logger.info(`connection established: ${this.matchId}`);
        this._connectHandler = () => {};
        this._isConnected = true;
        return this;
      })
      .catch(() => {
        const msg = `connection timeout after ${timeout} seconds: ${this.matchId}`;
        logger.warn(msg);
        this.stop();
        throw msg;
      });
  }

  stop() {
    this._detachStateUpdateListener();
    this.client.stop();
    logger.info(`connection closed: ${this.matchId}`);
  }

  send(method: string, ...args: any[]) {
    console.assert(this.client.getState().isActive);
    try {
      this.client.moves[method](...args);
    } catch (err) {
      logger.warn(err);
    }
  }

  updatePlayerInfo({ name, ...rest }: Partial<TableturfPlayerInfo>) {
    const state = this.client.getState().G.players[this.playerId];
    let time: string;
    if (!state || name != state.name) {
      time = new Date().toUTCString();
    }
    this.send("updatePlayerInfo", { name, ...rest, time });
  }

  on(event: "update", handler: ClientUpdateHandler);

  on(event: "data", handler: ClientDataHandler);

  on(event, handler) {
    switch (event) {
      case "update":
        this._updateHandlers.push(handler);
        if (!!this._prevState) {
          try {
            handler(this._prevState, this._prevState);
          } catch (e) {
            console.warn(e);
          }
        }
        return;
      case "data":
        this._dataHandlers.push(handler);
        return;
      default:
        throw `invalid event type: ${event}`;
    }
  }

  static get current() {
    return _current;
  }

  protected handleTransportData(data: TransportData) {
    logger.log("receive data:", data);
    if (!this._isConnected) {
      const state = this.client.getState();
      if (!state || !state.isConnected) {
        return;
      }
      this._connectHandler();
    }
    for (const handler of this._dataHandlers) {
      try {
        handler(data);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  protected handleStateUpdate(state: TableturfClientState) {
    if (!state.G.players[this.playerId]) {
      this.updatePlayerInfo(DB.player);
    }
    logger.log("state update:", state);
    if (!this._prevState) {
      this._prevState = state;
    }
    for (const handler of this._updateHandlers) {
      try {
        handler(state, this._prevState);
      } catch (e) {
        console.warn(e);
      }
    }
    this._prevState = state;
  }
}
