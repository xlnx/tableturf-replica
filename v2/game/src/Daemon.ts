import { FilteredMetadata, State } from "boardgame.io";
import { Client } from "./Client";
import loglevel from "loglevel";
import { IMatchState } from "./Types";

const logger = loglevel.getLogger("daemon");
logger.setLevel("debug");

export class Daemon extends Client {
  private prevMatchData: FilteredMetadata;

  async start(): Promise<void> {
    await super.start();
    logger.log(`daemon[${this.matchID}] started`);
    this.prevMatchData = this.client.matchData;
    this.client.subscribe((state) =>
      setTimeout(() => this.handleUpdate(state))
    );
  }

  async stop(): Promise<void> {
    await super.stop();
    logger.log(`daemon[${this.matchID}] stopped`);
  }

  private handleUpdate(state: State<IMatchState>) {
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
  }
}
