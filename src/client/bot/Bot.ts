export abstract class Bot {
  protected _disconnectHandlers = [];
  protected _errorHandlers = [];

  async start(): Promise<this> {
    return this;
  }

  stop() {}

  abstract get info(): IBotInfo;

  abstract createSession(
    request: IBotCreateSessionRequest
  ): Promise<IBotCreateSessionResponse>;

  onDisconnect(handler: () => void) {
    this._disconnectHandlers.push(handler);
  }

  handleDisconnect() {
    this._disconnectHandlers.forEach((f) => f());
  }

  onError(handler: (err) => void) {
    this._errorHandlers.push(handler);
  }

  handleError(err) {
    this._errorHandlers.forEach((f) => f(err));
  }
}

export abstract class BotSession {
  protected _errorHandlers = [];

  abstract initialize(request: IBotSessionInitRequest): Promise<void>;

  abstract query(): Promise<IBotSessionQueryResponse>;

  abstract update(request: IBotSessionUpdateRequest): Promise<void>;

  async finalize(): Promise<void> {}

  onError(handler: (err) => void) {
    this._errorHandlers.push(handler);
  }

  protected handleError(err) {
    this._errorHandlers.forEach((f) => f(err));
  }
}

export interface BotConnector {
  id: string;
  info: IBotInfoBrief;
  connect: (timeout: number) => Promise<Bot>;
}

export interface IBotCreateSessionResponse {
  // the created session
  session: BotSession;
  // the selected deck if request.deck == undefined
  deck?: number[];
}
