import { Container, Loader, Texture } from "pixi.js";
import { Platform } from "./Platform";
import { getLogger } from "loglevel";

const logger = getLogger("system");
logger.setLevel("info");

export class PixiRootContainer extends Container {}

export class System extends Platform {
  static readonly url = new URL(window.location.href);
  static readonly args = this.url.searchParams;

  static texture(path: string): Texture {
    try {
      return Loader.shared.resources[path].texture;
    } catch {
      logger.error(`texture [${path}] not found`);
      return Texture.WHITE;
    }
  }
}
