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

  readonly matches = new Map<string, Daemon>();

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

  private async configureGateway(
    port: number,
    gatewayPort: number,
    apiPort: number
  ) {
    const app = new Koa();
    app.use(
      cors({
        // Set Access-Control-Allow-Origin header for allowed origins.
        origin: (ctx) => {
          const origin = ctx.get("Origin");
          return isOriginAllowed(origin, origins.public) ? origin : "";
        },
      })
    );

    const gameName = MatchController.name;
    const lobby = new LobbyClient({ server: `http://localhost:${apiPort}` });

    const router = new Router();

    const createDaemon = async (matchID: string) => {
      const { playerID, playerCredentials } = await lobby.joinMatch(
        gameName,
        matchID,
        {
          playerID: "0",
          playerName: "$daemon",
        }
      );
      const daemon = new Daemon(
        lobby,
        {
          server: `localhost:${port}`,
          matchID,
          playerID,
          credentials: playerCredentials,
        }
      );
      await daemon.start();
      this.matches.set(matchID, daemon);
      return daemon;
    }

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
      const { matchID } = await lobby.createMatch(gameName, { numPlayers: 5 });
      const daemon = await createDaemon(matchID);
      const body = await daemon.joinMatch(matchID, ctx.request.body as ICreateMatchBody);
      ctx.body = { matchID, ...body };
    });

    router.post("/match/:id/join", koaBody(), async (ctx) => {
      const matchID = ctx.params.id;
      const daemon = this.matches.get(matchID);
      if (!daemon) {
        ctx.throw(404, "Match " + matchID + " not found");
      }
      if (!daemon.isJoinable()) {
        ctx.throw(404, "Match " + matchID + " is not joinable");
      }
      const body = await daemon.joinMatch(matchID, ctx.request.body as IJoinMatchBody);
      ctx.body = { ...body };
    });

    app.use(router.routes()).use(router.allowedMethods());

    await new Promise<void>((resolve) => {
      this.gatewayInstance = app.listen(gatewayPort, resolve);
    });
  }
}
