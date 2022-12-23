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
} from "./Game";

const logger = getLogger("ui-controller");
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

type StateUpdateHandler = (
  state: TableturfClientState,
  prevState: TableturfClientState
) => void;

interface TableturfClientOpts {
  playerId: PlayerId;
  matchId: string;
  credentials?: string;
  multiplayer: (_: TransportOpts) => Transport;
}

let controller: Controller = null;
let updateHandlers: StateUpdateHandler[] = [];

export class Controller {
  public readonly client: _ClientImpl<TableturfGameState>;
  public readonly playerId: PlayerId;
  public readonly matchId: string;

  private readonly _detach: () => void;

  private _active = false;
  protected _prevState: TableturfClientState = null;

  constructor({
    multiplayer,
    playerId,
    matchId,
    ...opts
  }: TableturfClientOpts) {
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
    this._detach = this.client.subscribe((s) => {
      if (!!s) {
        this.handleStateUpdate(s);
      }
    });
  }

  isActive() {
    return this._active;
  }

  activate() {
    logger.log("activate", this);
    if (controller != null) {
      controller._active = false;
    }
    controller = this;
    this._active = true;
    if (!!this._prevState) {
      this.handleStateUpdate(this._prevState);
    }
  }

  send(method: string, ...args: any[]) {
    console.assert(this.client.getState().isActive);
    try {
      this.client.moves[method](...args);
    } catch (err) {
      logger.warn(err);
    }
  }

  stop() {
    this._detach();
    this.client.stop();
  }

  protected handleTransportData(data: TransportData) {
    logger.log("receive data:", data);
  }

  protected handleStateUpdate(state: TableturfClientState) {
    logger.log("state update:", state);
    if (this.isActive()) {
      if (!!this._prevState) {
        for (const handler of updateHandlers) {
          handler(state, this._prevState);
        }
      }
    }
    this._prevState = state;
  }

  static subscribe(handler: StateUpdateHandler) {
    updateHandlers.push(handler);
    if (controller && controller._prevState) {
      handler(controller._prevState, controller._prevState);
    }
  }
}

export class Host extends Controller {
  private _clientConnected = false;

  constructor(opts: TableturfClientOpts) {
    super(opts);
    this.client.start();
  }

  stop(): void {
    // host cannot be stopped
    this.client.events.setPhase("reset");
  }

  protected handleTransportData(data: TransportData): void {
    super.handleTransportData(data);
    if (data.type == "matchData") {
      const { isConnected } = data.args[1][1];
      if (!this._clientConnected && isConnected) {
        this._clientConnected = true;
        this.handleClientConnect();
      }
      if (this._clientConnected && !isConnected) {
        this._clientConnected = false;
        this.handleClientDisconnect();
      }
    }
  }

  protected handleClientConnect() {
    logger.log("client connected");
  }

  protected handleClientDisconnect() {
    logger.log("client disconnected");
  }
}

export class Client extends Controller {
  private _onConnect: () => void = () => {};
  private _isConnected = false;

  isConnected() {
    return this._isConnected;
  }

  protected handleTransportData(data: TransportData) {
    super.handleTransportData(data);
    if (this.client.getState().isConnected) {
      this._onConnect();
      this._onConnect = () => {};
    }
  }

  protected _connect(timeout: number): Promise<this> {
    const task = new Promise<void>((resolve) => {
      this._onConnect = resolve;
    });
    const timing = new Promise<void>((_, reject) =>
      setTimeout(reject, 1000 * timeout)
    );
    this.client.start();
    return Promise.race([task, timing])
      .then(() => {
        logger.info(`connection established: ${this.matchId}`);
        this._onConnect = () => {};
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
}
