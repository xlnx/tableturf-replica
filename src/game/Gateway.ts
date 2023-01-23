import type { CorsOptions } from "cors";
import Koa from "koa";
import cors from "@koa/cors";
import koaBody from "koa-body";
import Router from "@koa/router";
import { Origins, Server } from "boardgame.io/server";
import { LobbyClient } from "boardgame.io/client";
import { MatchController } from "./MatchController";
import { Daemon } from "./Daemon";

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

interface GatewayOptions {
  origins?: string[];
  port: number;
  gatewayPort: number;
  internalPortRange: [number, number];
  https?: {
    port: number;
    key: string;
    cert: string;
  };
}

export class Gateway {
  private readonly origins: any[] = [Origins.LOCALHOST_IN_DEVELOPMENT];
  private serverInstance: any;
  private gatewayInstance: any;
  private server;

  readonly matches = new Map<string, Daemon>();

  kill() {
    if (this.serverInstance) {
      this.server.kill(this.serverInstance);
    }
    if (this.gatewayInstance) {
      this.gatewayInstance.close();
    }
  }

  async run({
    origins,
    port,
    gatewayPort,
    internalPortRange,
    https,
  }: GatewayOptions) {
    if (origins) {
      this.origins.push(...origins);
    }

    let httpsOpts = null;
    if (https) {
      const fs = await import("fs");
      const path = await import("path");
      httpsOpts = {
        key: fs.readFileSync(path.resolve(process.cwd(), https.key), "utf8"),
        cert: fs.readFileSync(path.resolve(process.cwd(), https.cert), "utf8"),
      };
    }

    const [lo, hi] = internalPortRange;
    if (hi <= lo) {
      throw new Error(
        `internal port range [${lo}, ${hi}) must contain at least one valid port`
      );
    }

    this.server = Server({
      games: [MatchController],
      origins: this.origins,
      apiOrigins: [Origins.LOCALHOST],
      https: httpsOpts,
    });

    const apiPort = lo;
    this.serverInstance = await this.server.run({
      port,
      lobbyConfig: { apiPort },
    });

    const app = new Koa();
    app.use(
      cors({
        // Set Access-Control-Allow-Origin header for allowed origins.
        origin: (ctx) => {
          const origin = ctx.get("Origin");
          return isOriginAllowed(origin, this.origins) ? origin : "";
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
      const daemon = new Daemon(lobby, {
        server: `${https ? "https" : "http"}://localhost:${port}`,
        matchID,
        playerID,
        credentials: playerCredentials,
      });
      await daemon.start();
      this.matches.set(matchID, daemon);
      return daemon;
    };

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
      const { matchName = "match", ...body } = ctx.request
        .body as ICreateMatchBody;
      const { matchID } = await lobby.createMatch(gameName, {
        numPlayers: 5,
        setupData: { matchName },
      });
      const daemon = await createDaemon(matchID);
      const join = await daemon.joinMatch(matchID, body);
      ctx.body = { matchID, ...join };
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
      const join = await daemon.joinMatch(
        matchID,
        ctx.request.body as IJoinMatchBody
      );
      ctx.body = { ...join };
    });

    app.use(router.routes()).use(router.allowedMethods());

    await new Promise<void>((resolve) => {
      this.gatewayInstance = app.listen(gatewayPort, resolve);
    });

    if (https) {
      const { createServer } = await import("https");
      const server = createServer(httpsOpts, app.callback());
      console.log(`serving https ${https.port}`);
      server.listen(https.port);
    }
  }
}
