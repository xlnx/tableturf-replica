import { Client } from "./Client";
import loglevel from "loglevel";

const logger = loglevel.getLogger("daemon");
logger.setLevel("debug");

export class Daemon extends Client {
  async start(): Promise<void> {
    await super.start();
    logger.log(`daemon[${this.matchID}] started`);
  }

  async stop(): Promise<void> {
    await super.stop();
    logger.log(`daemon[${this.matchID}] stopped`);
  }
}
