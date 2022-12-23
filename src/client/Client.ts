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

type ClientDisconnectHandler = () => void;

interface ClientOptions {
  playerId: IPlayerId;
  matchId: string;
  credentials?: string;
  multiplayer: (_: TransportOpts) => Transport;
}

let _current: Client = null;

export class Client {
  public readonly client: _ClientImpl<TableturfGameState>;
  public readonly playerId: IPlayerId;
  public readonly matchId: string;

  private readonly _detachStateUpdateListener: () => void;
  private _connectHandler: () => void = () => {};
  private _rejectHandler: (err: string) => void = () => {};
  private _isConnected: boolean = false;
  private _isStopped: boolean = false;
  private _prevState: TableturfClientState = null;
  private _updateHandlers: ClientUpdateHandler[] = [];
  private _dataHandlers: ClientDataHandler[] = [];
  private _disconnectHandlers: ClientDisconnectHandler[] = [];

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
    console.assert(!this._isStopped);
    const task = new Promise<void>((_1, _2) => {
      this._connectHandler = _1;
      this._rejectHandler = _2;
    });
    const timing = new Promise<void>((_, reject) =>
      setTimeout(() => {
        reject(`connection timeout after ${timeout} seconds: ${this.matchId}`);
      }, 1000 * timeout)
    );
    this.client.start();
    return Promise.race([task, timing])
      .then(() => {
        logger.log(`connection established: ${this.matchId}`);
        this._connectHandler = () => {};
        this._rejectHandler = () => {};
        this._isConnected = true;
        return this;
      })
      .catch((err) => {
        logger.warn(err);
        this.stop();
        throw err;
      });
  }

  stop() {
    if (!this._isStopped) {
      this._isStopped = true;
      this._detachStateUpdateListener();
      this.client.stop();
      logger.info(`connection closed: ${this.matchId}`);
    }
  }

  send(method: string, ...args: any[]) {
    // setTimeout(() => {
    console.assert(this.client.getState().isActive);
    try {
      logger.debug(method, args);
      this.client.moves[method](...args);
    } catch (err) {
      logger.warn(err);
    }
    // });
  }

  on(event: "update", handler: ClientUpdateHandler);

  on(event: "data", handler: ClientDataHandler);

  on(event: "disconnect", handler: ClientDisconnectHandler);

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
      case "disconnect":
        this._disconnectHandlers.push(handler);
        return;
    }
  }

  static get current() {
    return _current;
  }

  protected getDefaultPlayerInfo() {
    return DB.player;
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
    setTimeout(() => {
      for (const handler of this._dataHandlers) {
        try {
          handler(data);
        } catch (e) {
          console.warn(e);
        }
      }
    });
  }

  protected handleStateUpdate(state: TableturfClientState) {
    logger.log("state update:", state);

    let prevState = this._prevState;
    this._prevState = state;

    if (!prevState) {
      setTimeout(() => {
        this.send("updatePlayerInfo", this.getDefaultPlayerInfo());
      });
    }

    const key = (state) =>
      JSON.stringify({ G: state.G, phase: state.ctx.phase });
    if (!prevState || key(state) != key(prevState)) {
      setTimeout(() => {
        for (const handler of this._updateHandlers) {
          try {
            handler(state, prevState || state);
          } catch (e) {
            console.warn(e);
          }
        }
      });
    }
  }

  protected handleDisconnect() {
    logger.warn("disconnected:", this.matchId);
    // rejected by remote
    if (!this._isConnected) {
      this._rejectHandler(`connection rejected by remote machine`);
      return;
    }
    // close connection
    this.stop();
    // call every handler
    setTimeout(() => {
      for (const handler of this._disconnectHandlers) {
        try {
          handler();
        } catch (e) {
          console.warn(e);
        }
      }
    });
  }
}
