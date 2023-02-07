import type { CorsOptions } from "cors";
import Koa from "koa";
import cors from "@koa/cors";
import koaBody from "koa-body";
import Router from "@koa/router";
import { Origins, Server } from "boardgame.io/server";
import { MatchController } from "./MatchController";
import { Lobby } from "./Lobby";

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

  lobby: Lobby;

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

    this.lobby = new Lobby({
      lobbyApiAddr: `http://localhost:${apiPort}`,
      gameAddr: `${https ? "https" : "http"}://localhost:${port}`,
    });

    const router = new Router();

    // FIXME: handle 500
    // FIXME: validate args
    router.get("/match/list", koaBody(), async (ctx) => {
      try {
        ctx.body = await this.lobby.listMatch();
      } catch (err) {
        ctx.throw(404, err.toString());
      }
    });

    router.get("/match/:id", koaBody(), async (ctx) => {
      try {
        ctx.body = await this.lobby.getMatch(ctx.params.id);
      } catch (err) {
        ctx.throw(404, err.toString());
      }
    });

    router.post("/match/create", koaBody(), async (ctx) => {
      try {
        ctx.body = await this.lobby.createMatch(
          ctx.request.body as ICreateMatchBody
        );
      } catch (err) {
        ctx.throw(404, err.toString());
      }
    });

    router.post("/match/:id/join", koaBody(), async (ctx) => {
      try {
        ctx.body = await this.lobby.joinMatch(
          ctx.params.id,
          ctx.request.body as IJoinMatchBody
        );
      } catch (err) {
        ctx.throw(404, `Match [${ctx.params.id}] is full up`);
      }
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
