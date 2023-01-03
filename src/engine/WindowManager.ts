// apply stylesheet
import "./WindowManager.less";

// registered plugins
import "@pixi/tilemap";

import { AbstractRenderer, Application, Container, Sprite } from "pixi.js";
import { Component } from "./Component";
import { Window } from "./Window";
import { Interaction } from "./Interaction";
import { PixiRootContainer, System } from "./System";

console.log(`window.devicePixelRatio = ${window.devicePixelRatio}`);

class Canvas extends Component {
  public readonly app: Application;

  constructor(
    public readonly parent: HTMLElement,
    width: number,
    height: number
  ) {
    super();

    this.layout = { width, height };
    this.anchor.set(0.5);

    this.app = new Application({
      width,
      height,
      antialias: true,
      autoDensity: true,
      backgroundAlpha: 0,
      resolution: Math.max(1, window.devicePixelRatio || 1),
    });

    this.app.stage = new PixiRootContainer();
    this.app.stage.addChild(this.ui);

    this.app.resizeTo = parent;
    const resize = () => {
      this.app.resize();
      const { clientWidth, clientHeight } = parent;
      this.scaleToFit(clientWidth, clientHeight);
      this.position.set(clientWidth / 2, clientHeight / 2);
    };
    new ResizeObserver(resize).observe(parent);
    setTimeout(resize, 0);

    (<Container>(<any>this).ui2).sortableChildren = true;

    parent.appendChild(this.app.view);
  }
}

interface Layer {
  root: HTMLElement;
  canvas?: Canvas;
  windows: Window[];
}

interface LayerOptions {
  name?: string;
  canvas?: boolean;
  windows?: Window[];
}

export interface WindowManagerOptions {
  name: string;
  layers: LayerOptions[];
}

let wm: WindowManager = null;

export class WindowManager {
  public readonly root: HTMLElement;

  private readonly _renderer: AbstractRenderer;
  private readonly _layers: Layer[] = [];

  constructor(options: WindowManagerOptions) {
    // compute wm size
    const [w0, h0] = [1920, 1080];
    let width = parseInt(System.args.get("width")) || w0;
    let height = parseInt(System.args.get("height")) || h0;
    const e = w0 / h0;
    if (width / height > e) {
      width = height * e;
    } else {
      height = width / e;
    }
    console.log(`wm size = ${width}x${height}`);

    // create root element
    this.root = document.createElement("div");
    this.root.classList.add("viewport");
    document.body.appendChild(this.root);
    const resize = () => {
      let { clientWidth: width, clientHeight: height } = document.body;
      if (width / height > e) {
        width = height * e;
      } else {
        height = width / e;
      }

      this.root.style.width = `${width}px`;
      this.root.style.height = `${height}px`;
      const tx = (document.body.clientWidth - width) / 2;
      const ty = (document.body.clientHeight - height) / 2;
      this.root.style.transform = `translate(${tx}px, ${ty}px)`;

      for (const layer of this._layers) {
        layer.root.style.transformOrigin = "top left";
        layer.root.style.transform = `scale(${width / w0})`;
      }
    };
    new ResizeObserver(resize).observe(document.body);
    setTimeout(resize, 0);

    // create layers
    const { name, layers } = options;
    for (const { canvas = false, windows = [] } of layers) {
      const layerRoot = document.createElement("div");
      layerRoot.classList.add("layer");
      this.root.appendChild(layerRoot);

      const root = document.createElement("div");
      root.classList.add("layer-h5-root");

      const layer: Layer = { root, windows: [] };
      this._layers.push(layer);

      if (windows.length && canvas) {
        const canvasRoot = document.createElement("div");
        canvasRoot.classList.add("canvas");
        layerRoot.appendChild(canvasRoot);
        layer.canvas = new Canvas(canvasRoot, width, height);

        if (!this._renderer) {
          this._renderer = layer.canvas.app.renderer;
          const hitbox = new Sprite();
          hitbox.width = width;
          hitbox.height = height;
          hitbox.zIndex = 1e10;
          layer.canvas.addChild(hitbox);
          new Interaction(
            canvasRoot,
            this._renderer.plugins.interaction,
            hitbox,
            layer.canvas.ui
          );
        }
      }

      for (const window of windows) {
        layer.windows.push(window);
        (<any>window).layer = layer;
        root.appendChild(window.rootElement);
        if (canvas) {
          window.position.set(0);
          window.scaleToFit(width, height);
          layer.canvas.addChild(window);
        }
        WindowManager.hideWindow(window);
      }

      layerRoot.appendChild(root);
    }
  }

  static get renderer() {
    return wm && wm._renderer;
  }

  static showWindow(window: Window) {
    const layer: Layer = (<any>window).layer;
    console.assert(layer);
    layer.canvas && layer.canvas.parent.classList.remove("hidden");
    layer.windows.forEach((w) => {
      if (w === window) {
        w.ui.visible = true;
        w.rootElement.classList.remove("hidden");
      } else {
        w.ui.visible = false;
        w.rootElement.classList.add("hidden");
      }
    });
  }

  static hideWindow(window: Window) {
    const layer: Layer = (<any>window).layer;
    console.assert(layer);
    if (window.ui.visible) {
      layer.canvas && layer.canvas.parent.classList.add("hidden");
    }
    window.ui.visible = false;
    window.rootElement.classList.add("hidden");
  }

  static install(options: WindowManagerOptions) {
    console.assert(!wm);
    wm = new WindowManager(options);
  }
}
