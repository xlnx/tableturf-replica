import { RenderTexture, Texture } from "pixi.js";
import { WindowManager } from "./WindowManager";
import { Component } from "./Component";

// TODO: make this always valid
export class RenderBuffer<T extends {} = {}> extends Component<T> {
  private mTexture?: Texture;

  constructor(props: T, private readonly animate: boolean = true) {
    super(props);
  }

  get texture(): Texture {
    if (this.mTexture != null) {
      return this.mTexture;
    }

    const renderTexture = RenderTexture.create({
      width: this.layout.width,
      height: this.layout.height,
    });
    const fn = () => {
      const { renderer } = WindowManager;
      if (renderer) {
        renderer.render(this.ui, { renderTexture });
        if (this.animate) {
          window.requestAnimationFrame(fn);
        }
      } else {
        window.requestAnimationFrame(fn);
      }
    };
    window.requestAnimationFrame(fn);

    this.mTexture = renderTexture;
    return this.mTexture;
  }
}
