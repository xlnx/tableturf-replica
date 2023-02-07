import { LobbyAPI } from "boardgame.io";
import { Match } from "./Match";

interface GatewayClientOptions {
  hostname: string;
  port: number;
  gatewayPort: number;
  https?: boolean;
}

export class GatewayClient {
  readonly addr: string;
  readonly gatewayAddr: string;

  constructor({
    hostname,
    port,
    gatewayPort,
    https = false,
  }: GatewayClientOptions) {
    const addr = `${https ? "https" : "http"}://${hostname}`;
    this.addr = `${addr}:${port}`;
    this.gatewayAddr = `${addr}:${gatewayPort}`;
  }

  async listMatches(): Promise<LobbyAPI.MatchList> {
    return await this.request(`/match/list`);
  }

  async getMatch(matchID: string): Promise<LobbyAPI.Match> {
    return await this.request(`/match/${matchID}`);
  }

  async createMatch(body: ICreateMatchBody): Promise<Match> {
    const response = await this.post("/match/create", { body });
    return await this.joinMatchByToken(response.matchID, response);
  }

  async joinMatch(matchID: string, body: IJoinMatchBody): Promise<Match> {
    const response = await this.post(`/match/${matchID}/join`, { body });
    return await this.joinMatchByToken(matchID, response);
  }

  private async joinMatchByToken(
    matchID: string,
    token: LobbyAPI.JoinedMatch
  ): Promise<Match> {
    const { playerID, playerCredentials } = token;
    const match = new Match({
      server: this.addr,
      matchID,
      playerID,
      credentials: playerCredentials,
    });
    await match.start();
    return match;
  }

  private async request(route: string, init?: RequestInit) {
    const response = await fetch(this.gatewayAddr + route, init);

    if (!response.ok) {
      let details: any;

      try {
        details = await response.clone().json();
      } catch {
        try {
          details = await response.text();
        } catch (error) {
          details = error.message;
        }
      }

      // details
      if (response.status == 404) {
        throw new Error(details);
      } else {
        throw new Error(`HTTP status ${response.status}`);
      }
    }

    return response.json();
  }

  private async post(route: string, opts: { body?: any; init?: RequestInit }) {
    let init: RequestInit = {
      method: "post",
      body: JSON.stringify(opts.body),
      headers: { "Content-Type": "application/json" },
    };
    if (opts.init)
      init = {
        ...init,
        ...opts.init,
        headers: { ...init.headers, ...opts.init.headers },
      };
    return this.request(route, init);
  }
}
