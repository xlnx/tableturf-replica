// install wm first
import "./engine/WindowManager";

import { WebfontLoaderPlugin } from "pixi-webfont-loader";
import { Loader } from "pixi.js";
import Manifest from "./assets/manifest.json";
import Manifest_1 from "./assets/manifest_1.json";
import { System } from "./engine/System";

Loader.registerPlugin(WebfontLoaderPlugin);

async function main() {
  Loader.shared.add({ name: "Splatoon1", url: "fonts/Splatoon1-common.woff2" });
  Loader.shared.add({ name: "Splatoon2", url: "fonts/Splatoon2-common.woff2" });

  System.loadManifest(Manifest_1);

  await Promise.all([
    System.loadManifest(Manifest),
    new Promise((resolve) => {
      Loader.shared.onComplete.once(resolve);
      Loader.shared.load();
    }),
  ]);

  import("./Main");
}

main();
