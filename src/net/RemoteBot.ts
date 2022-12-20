import {
  Bot,
  BotInfo,
  BotSession,
  BotSessionInitRequest,
  BotSessionQueryResponse,
  BotSessionUpdateRequest,
  CreateSessionRequest,
  CreateSessionResponse,
} from "./Bot";
import { Client as WsRpcClientImpl } from "rpc-websockets";
import { IWSRequestParams } from "rpc-websockets/dist/lib/client";

interface RemoteBotOptions {
  url: string;
  timeout?: number;
}

class WsRpcClient extends WsRpcClientImpl {
  constructor(...args) {
    super(...args);
  }

  call(
    method: string,
    params?: IWSRequestParams,
    timeout?: number
  ): Promise<any> {
    return super.call(method, params, timeout).catch(({ code, message }) => {
      throw `error[${code}]: ${message}`;
    });
  }
}

export class RemoteBot extends Bot {
  private _rpc: WsRpcClient;
  private _info: BotInfo;

  constructor(private readonly opts: RemoteBotOptions) {
    super();
  }

  get info(): BotInfo {
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
    const rpc = new WsRpcClient(url, { autoconnect: false });
    rpc.on("open", resolve);
    rpc.on("close", () => reject(`connection closed: ${url}`));
    rpc.on("error", () => reject(`connection error: ${url}`));
    try {
      rpc.connect();
      await promise;
      // FIXME: basic verification
      const info: any = await rpc.call("get_bot_info");
      this._info = info;
      this._rpc = rpc;
      return this;
    } catch (e) {
      rpc.close();
      throw e;
    }
  }

  stop() {
    this._rpc.close();
  }

  async createSession(
    request: CreateSessionRequest
  ): Promise<CreateSessionResponse> {
    // FIXME: basic verification
    const response: any = await this._rpc.call("create_session", request);
    return {
      session: new RemoteBotSession(this._rpc, response.session),
      deck: response.deck,
    };
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

  private async call(method: string, params?: any): Promise<any> {
    return await this._rpc.call(method, {
      session: this._id,
      params: { ...params },
    });
  }

  async initialize(request: BotSessionInitRequest): Promise<void> {
    await this.call("session_initialize", request);
  }

  async query(): Promise<BotSessionQueryResponse> {
    // FIXME: basic verification
    return await this.call("session_query");
  }

  async update(request: BotSessionUpdateRequest): Promise<void> {
    await this.call("session_update", request);
  }

  async finalize(): Promise<void> {
    await this.call("session_finalize");
  }
}
