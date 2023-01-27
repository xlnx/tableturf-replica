import { Loader } from "@pixi/loaders";
import { Texture } from "@pixi/core";
import { WRAP_MODES } from "@pixi/constants";
import { Platform } from "./Platform";

export class System extends Platform {
  static readonly url = new URL(window.location.href);
  static readonly args = this.url.searchParams;

  private static readonly loaders: Loader[] = [];
  private static readonly textures: any = {};

  static texture(path: string): Texture {
    const loader = this.loaders.find((loader) => path in loader.resources);
    if (loader) {
      return loader.resources[path].texture;
    }
    if (!(path in this.textures)) {
      this.textures[path] = Texture.from("/textures/" + path, {
        wrapMode: WRAP_MODES.REPEAT,
      });
    }
    return this.textures[path];
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
