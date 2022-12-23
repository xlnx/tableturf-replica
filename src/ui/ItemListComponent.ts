import { Texture } from "pixi.js";
import { Color } from "../engine/Color";
import { Component } from "../engine/Component";
import { EaseFunc } from "../engine/animations/Ease";
import { WheelHandler } from "../engine/events/WheelHandler";
import { TargetAnimation } from "../engine/animations/TargetAnimation";
import { DragHandler } from "../engine/events/DragHandler";
import { getLocalPos } from "../engine/events/Utils";
import regression from "regression";

interface IItemListComponentOptions {
  width: number;
  height: number;
}

interface IItemListComponentProps<T> {
  items: T[];
  bg: {
    color: Color;
    alpha: number;
  };
  layout: {
    xlimit: number;
    padding?: {
      x: number;
      y?: number;
    };
    anchor?: {
      x: number;
      y?: number;
    };
  };
}

export class ItemListComponent<
  T extends Component = Component
> extends Component<IItemListComponentProps<T>> {
  private items: T[] = [];
  private height: number = 0;

  constructor(options: IItemListComponentOptions) {
    super({
      items: [],
      bg: {
        color: Color.WHITE,
        alpha: 0.5,
      },
      layout: {
        xlimit: 4,
      },
    });

    const self = this;
    const { width, height } = options;
    this.layout = { width, height };

    const bg = this.addSprite({
      width,
      height,
      texture: Texture.WHITE,
    });

    const root = this.addContainer();
    root.mask = this.addSprite({
      width,
      height,
      texture: Texture.WHITE,
    });

    const itemRoot = this.addContainer({
      parent: root,
    });
    this.props.items.onUpdate((items) => {
      itemRoot.removeChildren();
      this.items = items.slice();
      if (items.length != 0) {
        const { width, height } = items[0].layout;
        console.assert(
          items.every(
            ({ layout: { width: w, height: h } }) => width == w && height == h
          )
        );
        items.forEach((item) => itemRoot.addChild(item.ui));
        this.updateLayout();
      }
    });

    this.props.layout.onUpdate(() => {
      if (this.items.length != 0) {
        this.updateLayout();
      }
    });

    this.props.bg.onUpdate(({ color, alpha }) => {
      bg.tint = color.i32;
      bg.alpha = alpha;
    });

    const VF_SCALE = 8;
    const scroll = TargetAnimation.of(0)
      .onEase(0, EaseFunc.viscousFluid(VF_SCALE))
      .onUpdate((y) => (itemRoot.y = -y));

    this.handle(
      class extends WheelHandler {
        stops: EventType[] = ["wheel"];
        wheel(pos: Coordinate, dy: number) {
          const v = -1;
          const dt = 0.5;
          const y1 = self.height - self.layout.height;
          const y = Math.max(0, Math.min(y1, scroll.targetValue - dy * v));
          scroll.update(y, dt);
        }
      }
    );
    this.handle(
      class extends DragHandler {
        stops: EventType[] = ["wheel", "drag"];
        y0: number;
        li: [number, number][];
        drag(pos: Coordinate): void {
          this.li = [];
          const y = scroll.value;
          this.y0 = y + this.getLocalY(pos);
          this.scrollTo(y);
        }
        move(pos: Coordinate): void {
          const y = this.y0 - this.getLocalY(pos);
          const t = performance.now();
          this.li.push([t, y]);
          if (this.li.length > 32) {
            this.li.shift();
          }
          this.scrollTo(y);
        }
        drop(pos: Coordinate): void {
          const t = performance.now();
          const li = this.li.filter(([t0, _]) => t - t0 < 100);
          let v = 0;
          if (li.length > 1) {
            const order = 1;
            const e = regression.polynomial(li, { order });
            e.equation.slice(0, -1).forEach((a, i) => {
              const b = order - i;
              v += a * b * t ** (b - 1);
            });
          }
          const dt = 0.5;
          const y = this.y0 - this.getLocalY(pos);
          const dy = (dt * v * 1000) / VF_SCALE;
          this.scrollTo(y + dy, dt);
        }
        private scrollTo(y: number, dt?: number) {
          const y1 = self.height - self.layout.height;
          y = Math.max(0, Math.min(y1, y));
          scroll.update(y, dt);
        }
        private getLocalY(pos: Coordinate) {
          const { height } = self.layout;
          return getLocalPos(pos, this.sender).y * height;
        }
      }
    );
  }

  private updateLayout() {
    const {
      xlimit,
      padding = { x: 0 },
      anchor = { x: 0 },
    } = this.props.layout.value;
    const { x: dx, y: dy = dx } = padding;
    const { x: ax, y: ay = ax } = anchor;

    const { width: w, height: h } = this.items[0].layout;
    const w1 = (this.layout.width - (xlimit + 1) * dx) / xlimit;
    const e = w1 / w;
    const h1 = h * e;

    const ny = Math.ceil(this.items.length / xlimit);
    this.height = ny * h1 + (ny + 1) * dy;

    this.items.forEach((item) => item.scaleToFit(w1, h1));
    let y = 0;
    for (; ; ++y) {
      for (let x = 0; x < xlimit; ++x) {
        const i = x + y * xlimit;
        if (i >= this.items.length) {
          return;
        }
        const item = this.items[i];
        item.position.set(
          (w1 + dx) * x + dx + w1 * ax,
          (h1 + dy) * y + dy + h1 * ay
        );
        item.anchor.set(ax, ay);
      }
    }
  }
}
