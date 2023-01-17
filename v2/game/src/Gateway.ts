import type { CorsOptions } from "cors";
import Koa from "koa";
import cors from "@koa/cors";
import koaBody from "koa-body";
import Router from "@koa/router";
import { Origins, Server } from "boardgame.io/server";
import { LobbyClient } from "boardgame.io/client";
import { MatchController } from "./MatchController";
import { Daemon } from "./Daemon";

const origins = {
  public: [Origins.LOCALHOST_IN_DEVELOPMENT],
  internal: [Origins.LOCALHOST],
};

function isOriginAllowed(
  origin: string,
  allowedOrigin: CorsOptions["origin"]
): boolean {
  if (Array.isArray(allowedOrigin)) {
    for (const entry of allowedOrigin) {
      if (isOriginAllowed(origin, entry)) {
        return true;
      }
    }
    return false;
  } else if (typeof allowedOrigin === "string") {
    return origin === allowedOrigin;
  } else if (allowedOrigin instanceof RegExp) {
    return allowedOrigin.test(origin);
  } else {
    return !!allowedOrigin;
  }
}

export class Gateway {
  private server = Server({
    games: [MatchController],
    origins: origins.public,
    apiOrigins: origins.internal,
  });
  private serverInstance: any;
  private gatewayInstance: any;
  private matches = new Map<string, MatchInfo>();

  async run(opts: {
    port: number;
    gatewayPort: number;
    internalPortRange: [number, number];
  }) {
    const [lo, hi] = opts.internalPortRange;
    if (hi <= lo) {
      throw new Error(
        `internal port range [${lo}, ${hi}) must contain at least one valid port`
      );
    }

    const apiPort = lo;
    this.serverInstance = await this.server.run({
      port: opts.port,
      lobbyConfig: { apiPort },
    });

    await this.configureGateway(opts.port, opts.gatewayPort, apiPort);
  }

  kill() {
    if (this.serverInstance) {
      this.server.kill(this.serverInstance);
    }
    if (this.gatewayInstance) {
      this.gatewayInstance.close();
    }
  }

  getDaemon(matchID: string) {
    return this.matches.get(matchID).daemon;
  }

  private async configureGateway(
    port: number,
    gatewayPort: number,
    apiPort: number
  ) {
    const gateway = new Koa();
    gateway.use(
      cors({
        // Set Access-Control-Allow-Origin header for allowed origins.
        origin: (ctx) => {
          const origin = ctx.get("Origin");
          return isOriginAllowed(origin, origins.public) ? origin : "";
        },
      })
    );

    const lobby = new LobbyClient({ server: `http://localhost:${apiPort}` });
    const addr = `localhost:${port}`;
    this.configureRouter(addr, gateway, lobby);

    await new Promise<void>((resolve) => {
      this.gatewayInstance = gateway.listen(gatewayPort, resolve);
    });
  }

  private configureRouter(addr: string, gateway: Koa, lobby: LobbyClient) {
    const gameName = MatchController.name;
    const router = new Router();

    router.get("/match/list", koaBody(), async (ctx) => {
      const { matches } = await lobby.listMatches(gameName);
      ctx.body = {
        matches: matches.filter((match) => this.matches.has(match.matchID)),
      };
    });

    router.get("/match/:id", koaBody(), async (ctx) => {
      const matchID = ctx.params.id;
      if (!this.matches.has(matchID)) {
        ctx.throw(404, "Match " + matchID + " not found");
      }
      ctx.body = await lobby.getMatch(gameName, matchID);
    });

    router.post("/match/create", koaBody(), async (ctx) => {
      const { playerName } = ctx.request.body as ICreateMatchBody;
      const { matchID } = await lobby.createMatch(gameName, { numPlayers: 5 });
      const { playerID, playerCredentials } = await lobby.joinMatch(
        gameName,
        matchID,
        {
          playerID: "0",
          playerName: "$daemon",
        }
      );
      const daemon = new Daemon(
        {
          server: addr,
          matchID,
          playerID,
          credentials: playerCredentials,
        },
        async () => {
          await lobby.leaveMatch(gameName, matchID, {
            playerID,
            credentials: playerCredentials,
          });
        }
      );
      await daemon.start();
      const { ...join } = await lobby.joinMatch(gameName, matchID, {
        playerName,
      });
      this.matches.set(matchID, { daemon, refcnt: 1 });
      ctx.body = { matchID, ...join };
    });

    router.post("/match/:id/join", koaBody(), async (ctx) => {
      const matchID = ctx.params.id;
      const { playerName } = ctx.request.body as IJoinMatchBody;
      if (!this.matches.has(matchID)) {
        ctx.throw(404, "Match " + matchID + " not found");
      }
      const { ...join } = await lobby.joinMatch(gameName, matchID, {
        playerName,
      });
      ++this.matches.get(matchID).refcnt;
      ctx.body = { ...join };
    });

    // authed
    router.post("/match/:id/leave", koaBody(), async (ctx) => {
      const matchID = ctx.params.id;
      const { ...body } = ctx.request.body;
      if (!this.matches.has(matchID)) {
        ctx.throw(404, "Match " + matchID + " not found");
      }
      await lobby.leaveMatch(gameName, matchID, { ...body });
      if (!--this.matches.get(matchID).refcnt) {
        const { daemon } = this.matches.get(matchID);
        this.matches.delete(matchID);
        await daemon.stop();
      }
      ctx.body = {};
    });

    gateway.use(router.routes()).use(router.allowedMethods());
  }
}

interface MatchInfo {
  daemon: Daemon;
  refcnt: number;
}
