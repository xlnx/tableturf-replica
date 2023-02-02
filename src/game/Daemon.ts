import { LobbyAPI } from "boardgame.io";
import { Client, ClientConnectOptions } from "./Client";
import { LobbyClient } from "boardgame.io/client";
import { MatchController } from "./MatchController";
import { MatchDriver } from "./MatchDriver";
import loglevel from "loglevel";

const logger = loglevel.getLogger("daemon");
logger.setLevel("debug");

class Countdown {
  private canceled = false;

  constructor(timeSec: number, callback: () => void) {
    setTimeout(() => {
      // the event may have already been canceled
      if (!this.canceled) {
        callback();
      }
    }, timeSec * 1000);
  }

  cancel() {
    this.canceled = true;
  }
}

export class Daemon extends Client {
  private joinable = false;
  private readonly playerCredentials: string[] = [];
  private readonly driver: MatchDriver;

  private countdown: Countdown;

  constructor(private readonly lobby: LobbyClient, opts: ClientConnectOptions) {
    super(opts);
    this.on("player-join", this.handlePlayerJoinMatch.bind(this));
    this.on("player-leave", this.handlePlayerLeaveMatch.bind(this));
    this.driver = new MatchDriver(this);
    this.driver.on("round", this.handleNewRound.bind(this));
  }

  isJoinable() {
    return this.joinable;
  }

  async joinMatch(
    matchID: string,
    body: IJoinMatchBody
  ): Promise<LobbyAPI.JoinedMatch> {
    const { playerID, playerCredentials } = await this.lobby.joinMatch(
      MatchController.name,
      matchID,
      body
    );
    this.playerCredentials[+playerID] = playerCredentials;
    this.joinable = true;
    return { playerID, playerCredentials };
  }

  async start(): Promise<void> {
    await super.start();
    logger.log(`daemon[${this.matchID}] started`);
  }

  async stop(): Promise<void> {
    super.stop();
    try {
      await this.lobby.leaveMatch(MatchController.name, this.matchID, {
        playerID: this.client.playerID,
        credentials: this.client.credentials,
      });
    } catch (e) {
      //
    }
    logger.log(`daemon[${this.matchID}] stopped`);
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

  private handlePlayerLeaveMatch(playerID: string) {
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
    const leave = this.lobby.leaveMatch(MatchController.name, this.matchID, {
      playerID,
      credentials: this.playerCredentials[+playerID],
    });
    if (
      this.client.matchData.slice(1).every(({ isConnected }) => !isConnected)
    ) {
      this.joinable = false;
      leave.then(() => this.stop());
    }
  }

  private handleNewRound(round: number) {
    // handle timer here
    if (this.countdown) {
      // cancel previous countdown
      this.countdown.cancel();
      this.countdown = null;
    }
    const dt = this.client.getState().G.meta.stepTimeQuotaSec;
    if (dt == null) {
      return;
    }
    this.countdown = new Countdown(dt, () => {
      // sync state with boardgame.io
      this.send("HandleRoundTle", round);
    });
  }
}
