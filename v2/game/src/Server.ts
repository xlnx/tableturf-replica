import { Server as createServer, Origins } from "boardgame.io/server";
import { MatchController } from "./MatchController";

export class Server {
  private server: ReturnType<typeof createServer>;

  constructor() {
    this.server = createServer({
      games: [MatchController],
    });
  }

  async run(options: { port: number; lobbyApiPort: number }) {
    await this.server.run({
      port: options.port,
      lobbyConfig: {
        apiPort: options.lobbyApiPort,
      },
    });
  }

  async createMatch(): Promise<> {}
}
