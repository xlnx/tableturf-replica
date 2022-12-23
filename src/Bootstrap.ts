// install wm first
import "./engine/WindowManager";

import { WebfontLoaderPlugin } from "pixi-webfont-loader";
import { Loader, WRAP_MODES } from "pixi.js";
import Manifest from "./assets/manifest.json";

Loader.registerPlugin(WebfontLoaderPlugin);
const loader = Loader.shared;

loader.add({ name: "Splatoon1", url: "fonts/Splatoon1.otf" });
loader.add({ name: "Splatoon2", url: "fonts/Splatoon2.otf" });

for (const [name, url] of Object.entries(Manifest)) {
  loader.add({
    name,
    url: <string>url,
  });
}

loader.onComplete.once(async () => {
  for (const name of Object.keys(Manifest)) {
    loader.resources[name].texture.baseTexture.wrapMode = WRAP_MODES.REPEAT;
  }
  await import("./Main");
});

loader.load();
