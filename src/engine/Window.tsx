import { Sprite, Texture } from "pixi.js";
import { Color } from "./Color";
import { Component } from "./Component";
import { createRoot } from "react-dom/client";
import React from "react";
import { WindowManager } from "./WindowManager";

interface IWindowProps {
  bgTint: Color;
  bgAlpha: number;
}

export class Window<Props extends {} = {}> extends Component<
  IWindowProps & Props
> {
  layout = { width: 1, height: 1 };

  public readonly rootElement: HTMLElement;

  protected readonly bg: Sprite;

  constructor(props?: Partial<IWindowProps> & Props) {
    super({
      bgTint: Color.WHITE,
      bgAlpha: 1,
      ...props,
    });

    this.bg = this.addSprite({
      texture: Texture.WHITE,
      zIndex: -1e5,
    });
    setTimeout(() => {
      this.bg.width = this.layout.width;
      this.bg.height = this.layout.height;
    }, 0);

    this.rootElement = document.createElement("div");
    this.rootElement.classList.add("window");
    setTimeout(() => {
      const Fn = () => <React.Fragment>{this.renderReact()}</React.Fragment>;
      createRoot(this.rootElement).render(<Fn />);
    }, 0);

    this.props.bgTint.onUpdate((v) => (this.bg.tint = v.i32));
    this.props.bgAlpha.onUpdate((v) => (this.bg.alpha = v));
  }

  protected renderReact(): React.ReactNode {
    return <React.Fragment></React.Fragment>;
  }

  show(show?: boolean) {
    if (show == false) {
      return this.hide();
    }
    WindowManager.showWindow(this);
  }

  hide() {
    WindowManager.hideWindow(this);
  }
}
