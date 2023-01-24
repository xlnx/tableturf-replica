import { Container, Loader, Texture, WRAP_MODES } from "pixi.js";
import { Platform } from "./Platform";
import { getLogger } from "loglevel";

const logger = getLogger("system");
logger.setLevel("info");

export class PixiRootContainer extends Container {}

export class System extends Platform {
  static readonly url = new URL(window.location.href);
  static readonly args = this.url.searchParams;

  private static readonly loaders: Loader[] = [];

  static texture(path: string): Texture {
    const loader = this.loaders.find((loader) => path in loader.resources);
    if (loader) {
      return loader.resources[path].texture;
    }
    return Texture.from("/textures/" + path);
  }

  static loadManifest(manifest: any): Promise<void> {
    const loader = new Loader();
    this.loaders.push(loader);
    for (const [name, url] of Object.entries(manifest)) {
      loader.add({
        name,
        url: <string>url,
      });
    }
    return new Promise((resolve) => {
      loader.onComplete.once(async () => {
        for (const name of Object.keys(manifest)) {
          loader.resources[name].texture.baseTexture.wrapMode =
            WRAP_MODES.REPEAT;
        }
        resolve();
      });
      loader.load();
    });
  }
}
