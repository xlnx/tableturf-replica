import { Bot, BotSession, IBotCreateSessionResponse } from "./Bot";
import { Client as WsRpcClientImpl } from "rpc-websockets";
import { validateSchema } from "../../Schema";

interface RpcOptions {
  method: string;
  params?: any;
  returnType: string;
  timeout?: number;
}

class WsRpcClient extends WsRpcClientImpl {
  async rpc<T = any>({
    method,
    params,
    timeout,
    returnType,
  }: RpcOptions): Promise<T> {
    const val = await super
      .call(method, params, timeout)
      .catch(({ code, message }) => {
        throw `error[${code}]: ${message}`;
      });
    if (returnType) {
      return validateSchema<T>(returnType, val);
    }
    return val as T;
  }
}

interface RemoteBotOptions {
  url: string;
  timeout?: number;
}

export class RemoteBot extends Bot {
  private _rpc: WsRpcClient;
  private _info: IBotInfo;

  constructor(private readonly opts: RemoteBotOptions) {
    super();
  }

  get info(): IBotInfo {
    return this._info;
  }

  async start(): Promise<this> {
    console.assert(!this._info);
    let resolve, reject;
    const promise = new Promise((_1, _2) => {
      [resolve, reject] = [_1, _2];
    });
    // FIXME: timeout is not handled
    const { url } = this.opts;
    let rpc: WsRpcClient;
    try {
      rpc = new WsRpcClient(url, {
        autoconnect: false,
        reconnect: false,
      });
      rpc.on("open", resolve);
      rpc.on("close", () => reject(`connection closed: ${url}`));
      rpc.on("error", () => reject(`connection error: ${url}`));
      rpc.connect();
      await promise;
      const info = await rpc.rpc<IBotInfo>({
        method: "get_bot_info",
        returnType: "IBotInfo",
      });
      this._info = info;
      this._rpc = rpc;
      rpc.on("error", this.handleDisconnect.bind(this));
      rpc.on("close", this.handleDisconnect.bind(this));
      return this;
    } catch (e) {
      try {
        rpc && rpc.close();
      } catch {} // eslint-disable-line no-empty
      throw e;
    }
  }

  stop() {
    try {
      this._rpc && this._rpc.close();
    } catch {} // eslint-disable-line no-empty
  }

  async createSession(
    request: IBotCreateSessionRequest
  ): Promise<IBotCreateSessionResponse> {
    try {
      const response = await this._rpc.rpc<IRemoteBotCreateSessionResponse>({
        method: "create_session",
        params: request,
        returnType: "IRemoteBotCreateSessionResponse",
      });
      return {
        session: new RemoteBotSession(this._rpc, response.session),
        deck: response.deck,
      };
    } catch (err) {
      this.handleError(err);
    }
  }

  static async connect(opts: RemoteBotOptions) {
    return await new RemoteBot(opts).start();
  }
}

class RemoteBotSession extends BotSession {
  constructor(
    private readonly _rpc: WsRpcClient,
    private readonly _id: string
  ) {
    super();
  }

  private async rpc<T = any>({ params, ...rest }: RpcOptions): Promise<any> {
    try {
      return await this._rpc.rpc<T>({
        params: {
          session: this._id,
          params: { ...params },
        },
        ...rest,
      });
    } catch (err) {
      this.handleError(err);
    }
  }

  async initialize(request: IBotSessionInitRequest): Promise<void> {
    await this.rpc({
      method: "session_initialize",
      params: request,
      returnType: "",
    });
  }

  async query(): Promise<IBotSessionQueryResponse> {
    return await this.rpc({
      method: "session_query",
      returnType: "IBotSessionQueryResponse",
    });
  }

  async update(request: IBotSessionUpdateRequest): Promise<void> {
    await this.rpc({
      method: "session_update",
      params: request,
      returnType: "",
    });
  }

  async finalize(): Promise<void> {
    await this.rpc({
      method: "session_finalize",
      returnType: "",
    });
  }
}
