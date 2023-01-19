import { FilteredMetadata, State, LobbyAPI } from "boardgame.io";
import { Client, ClientConnectOptions } from "./Client";
import { LobbyClient } from "boardgame.io/client";
import loglevel from "loglevel";
import { TableturfGame } from "../Game";

const logger = loglevel.getLogger("daemon");
logger.setLevel("debug");

export class Daemon extends Client {
  private prevMatchData: FilteredMetadata;
  private joinable = false;
  private stopped = false;
  private readonly playerCredentials: string[] = [];

  constructor(private readonly lobby: LobbyClient, opts: ClientConnectOptions) {
    super(opts);
  }

  isJoinable() {
    return this.joinable;
  }

  async joinMatch(matchID: string, body: IJoinMatchBody): Promise<LobbyAPI.JoinedMatch> {
    const { playerID, playerCredentials } =
      await this.lobby.joinMatch(TableturfGame.name, matchID, body);
    this.playerCredentials[+playerID] = playerCredentials;
    this.joinable = true;
    return { playerID, playerCredentials };
  }

  async start(): Promise<void> {
    await super.start();
    logger.log(`daemon[${this.matchID}] started`);
    this.prevMatchData = this.client.matchData;
    this.client.subscribe((state) =>
      setTimeout(() => this.handleUpdate(state))
    );
  }

  async stop(): Promise<void> {
    this.stopped = true;
    await super.stop();
    await this.lobby.leaveMatch(TableturfGame.name, this.matchID, {
      playerID: this.client.playerID,
      credentials: this.client.credentials,
    });
    logger.log(`daemon[${this.matchID}] stopped`);
  }

  private handleUpdate(state: State<IMatchState>) {
    if (this.stopped) {
      return;
    }
    for (let i = 0; i < this.prevMatchData.length; ++i) {
      const c0 = this.prevMatchData[i].isConnected;
      const c1 = this.client.matchData[i].isConnected;
      if (!c0 && c1) {
        // player[i] joined the match
        this.handlePlayerJoinMatch(i.toString());
      }
      if (c0 && !c1) {
        // player[i] left the match
        this.handlePlayerLeftMatch(i.toString());
      }
    }
    this.prevMatchData = this.client.matchData;
  }

  private handlePlayerJoinMatch(playerID: string) {
    let { daemon, meta } = this.client.getState().G;
    daemon = { ...daemon, players: [...daemon.players, playerID] };
    if (meta.players.length < 2) {
      meta = { ...meta, players: [...meta.players, playerID] };
    }
    if (meta.host == "") {
      meta = { ...meta, host: playerID };
    }
    this.send("UpdateState", { daemon, meta });
  }

  private handlePlayerLeftMatch(playerID: string) {
    let { daemon, meta } = this.client.getState().G;
    const players = daemon.players.slice();
    players.splice(players.indexOf(playerID), 1);
    daemon = { ...daemon, players };
    if (meta.players.indexOf(playerID) != -1) {
      const players = meta.players.slice();
      players.splice(players.indexOf(playerID), 1);
      meta = { ...meta, players };
    }
    if (meta.host == playerID) {
      meta = { ...meta, host: players[0] || "" };
    }
    this.send("UpdateState", { daemon, meta });
    this.lobby.leaveMatch(TableturfGame.name, this.matchID, {
      playerID,
      credentials: this.playerCredentials[+playerID],
    })
    if (this.client.matchData.slice(1).every(({ isConnected }) => !isConnected)) {
      this.joinable = false;
      this.stop();
    }
  }
}
