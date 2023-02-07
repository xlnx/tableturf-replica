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

interface DaemonOptions {
  lobby: LobbyClient;
  server: string;
  matchID: string;
}

export class Daemon extends Client {
  readonly createTime = new Date();
  private ready = false;

  private readonly playerCredentials: string[] = [];

  private constructor(
    private readonly lobby: LobbyClient,
    opts: ClientConnectOptions
  ) {
    super(opts);

    /* set up meta handlers */
    this.on("player-join", (playerID) => {
      let { daemon, meta } = this.client.getState().G;
      daemon = { ...daemon, players: [...daemon.players, playerID] };
      if (meta.players.length < 2) {
        meta = { ...meta, players: [...meta.players, playerID] };
      }
      if (meta.host == "") {
        meta = { ...meta, host: playerID };
      }
      this.send("UpdateState", { daemon, meta });
      this.ready = true;
    });

    this.on("player-leave", (playerID) => {
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
        leave.then(() => this.stop());
      }
    });

    /* set up match driver */
    const driver = new MatchDriver(this);

    let countdown: Countdown;
    const cancelCountdown = () => {
      if (countdown) {
        // cancel previous countdown
        countdown.cancel();
        countdown = null;
      }
    };

    driver.on("round", (round) => {
      // handle timer here
      cancelCountdown();
      const dt = this.client.getState().G.meta.turnTimeQuotaSec;
      if (!dt) {
        // ttl not specified
        return;
      }
      countdown = new Countdown(dt, () => {
        // sync state with boardgame.io
        this.send("HandleRoundTle", round);
      });
    });

    driver.on("finish", () => {
      cancelCountdown();
    });

    driver.on("abort", () => {
      cancelCountdown();
    });
  }

  static async create({ lobby, ...opts }: DaemonOptions) {
    const { playerID, playerCredentials: credentials } = await lobby.joinMatch(
      MatchController.name,
      opts.matchID,
      {
        playerID: "0",
        playerName: "$daemon",
      }
    );
    const daemon = new Daemon(lobby, {
      ...opts,
      playerID,
      credentials,
    });
    await daemon.start();
    return daemon;
  }

  isReady() {
    return this.ready;
  }

  async requestJoinMatch(body: IJoinMatchBody): Promise<LobbyAPI.JoinedMatch> {
    const { playerID, playerCredentials } = await this.lobby.joinMatch(
      MatchController.name,
      this.client.matchID,
      body
    );
    this.playerCredentials[+playerID] = playerCredentials;
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
}
