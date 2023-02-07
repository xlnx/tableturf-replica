import { LobbyClient } from "boardgame.io/client";
import { Daemon } from "./Daemon";
import { MatchController } from "./MatchController";
import { LobbyAPI } from "boardgame.io";

interface LobbyOptions {
  lobbyApiAddr: string;
  gameAddr: string;
}

export class Lobby {
  private readonly lobby: LobbyClient;
  private readonly gameAddr: string;

  readonly matches = new Map<string, Daemon>();

  constructor({ lobbyApiAddr, gameAddr }: LobbyOptions) {
    this.lobby = new LobbyClient({ server: lobbyApiAddr });
    this.gameAddr = gameAddr;

    this.gc();
  }

  private async gc() {
    const expireSec = 60 * 5;
    const expireBeforeTime = new Date().getTime() - 1000 * expireSec;
    const li = [];
    this.matches.forEach((daemon, matchID) => {
      if (!daemon.isReady() && daemon.createTime.getTime() < expireBeforeTime) {
        li.push(matchID);
      }
    });
    li.forEach((matchID) => this.matches.delete(matchID));
    setTimeout(() => this.gc(), 1000 * 60);
  }

  async listMatch(): Promise<LobbyAPI.MatchList> {
    const { matches } = await this.lobby.listMatches(MatchController.name);
    const li = matches.filter((match) => {
      const daemon = this.matches.get(match.matchID);
      return daemon && daemon.isReady();
    });
    return { matches: li };
  }

  async getMatch(matchID: string): Promise<LobbyAPI.Match> {
    if (!this.matches.has(matchID)) {
      throw new Error(`Match [${matchID}] not found`);
    }
    return await this.lobby.getMatch(MatchController.name, matchID);
  }

  async createMatch({
    matchName = "match",
    ...body
  }: ICreateMatchBody): Promise<ICreateMatchResponse> {
    const { matchID } = await this.lobby.createMatch(MatchController.name, {
      numPlayers: 5,
      setupData: { matchName },
    });
    const daemon = await Daemon.create({
      lobby: this.lobby,
      server: this.gameAddr,
      matchID,
    });
    this.matches.set(matchID, daemon);
    const key = await daemon.requestJoinMatch(body);
    return { matchID, ...key };
  }

  async joinMatch(
    matchID: string,
    body: IJoinMatchBody
  ): Promise<IJoinMatchResponse> {
    const daemon = this.matches.get(matchID);
    if (!daemon) {
      throw new Error(`Match [${matchID}] not found`);
    }
    return await daemon.requestJoinMatch(body);
  }
}
