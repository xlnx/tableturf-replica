import { Container, Loader, Texture } from "pixi.js";
import { Platform } from "./Platform";

export class PixiRootContainer extends Container {}

export class System extends Platform {
  static readonly url = new URL(window.location.href);
  static readonly args = this.url.searchParams;

  static texture(path: string): Texture {
    return Loader.shared.resources[path].texture;
  }
}
