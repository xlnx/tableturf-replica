import { Texture } from "pixi.js";
import { ColorPalette } from "./ColorPalette";
import { Color } from "../engine/Color";
import { Component } from "../engine/Component";
import { EaseFunc } from "../engine/animations/Ease";

interface IInkBeatComponentProps {
  color: Color;
  angle: number;
  value: number;
}

const shadowAlpha = 0.3;

class InkBeatComponent extends Component<IInkBeatComponentProps> {
  layout = {
    width: 0,
    height: 0,
    inkbeat: {
      width: 140,
      height: 140,
    },
  };

  constructor() {
    super({
      color: Color.WHITE,
      angle: 0,
      value: 0,
    });

    const { width, height } = this.layout.inkbeat;

    const root = this.addContainer();

    const bgRoot = this.addContainer({ parent: root });
    this.addSprite({
      parent: bgRoot,
      anchor: 0.5,
      width,
      height,
      x: 2,
      y: 2,
      tint: Color.BLACK,
      alpha: shadowAlpha,
      texture: "InkBeatS_00.webp",
    });
    const bg = this.addSprite({
      parent: bgRoot,
      anchor: 0.5,
      width,
      height,
      texture: "InkBeatS_00.webp",
    });

    const text1 = this.addText({
      anchor: 0.5,
      x: 2,
      y: 2,
      alpha: 0.7,
      style: {
        fill: Color.BLACK.i32,
        fontFamily: "Splatoon1",
        fontSize: 36,
      },
    });
    const text = this.addText({
      anchor: 0.5,
      style: {
        fontFamily: "Splatoon1",
        fontSize: 36,
      },
    });

    const fn = () => {
      const color = this.props.color.value;
      const value = this.props.value.value;
      if (value >= 0) {
        bg.tint = color.i32;
        text.style.fill = Color.WHITE.i32;
        text1.text = text.text = `+${value}`;
      } else {
        bg.tint = Color.fromHex(0xc8c8c8).i32;
        text.style.fill = Color.fromHex(0x4c4c4c).i32;
        text1.text = text.text = `${value}`;
      }
      this.lock(bgRoot);
    };
    this.props.value.onUpdate(fn);
    this.props.color.onUpdate(fn);
    this.props.angle.onUpdate((v) => (bgRoot.angle = v));

    this.ui.alpha = 0;
  }
}

interface ISzMeterComponentProps {
  value1: number;
  value2: number;
  preview: boolean;
  preview1: number;
  preview2: number;
}

export class SzMeterComponent extends Component<ISzMeterComponentProps> {
  layout = {
    width: 0,
    height: 0,
    p1: {
      text: {
        x: 10,
        y: 94,
      },
      inkbeat: {
        x: 10 + 54,
        y: 94 - 57,
        angle: -45,
      },
      ink: {
        x: -18,
        y: 80,
        width: 360,
        scale: 1,
        angle: -25,
        alpha: 0.8,
        img: "Ink_04.webp",
      },
    },
    p2: {
      text: {
        x: 34,
        y: -94,
      },
      inkbeat: {
        x: 34 + 54,
        y: -94 - 57,
        angle: 0,
      },
      ink: {
        x: 42,
        y: -120,
        width: 360,
        scale: -1,
        angle: 0,
        alpha: 0.8,
        img: "Ink_02.webp",
      },
    },
  };

  private readonly playFn: (v1: number, v2: number) => Promise<any>;

  constructor() {
    super({
      value1: 0,
      value2: 0,
      preview: false,
      preview1: 0,
      preview2: 0,
    });

    const skew = (Math.PI * -15) / 180;

    const [text1, text2] = [
      { p: this.layout.p1, c: ColorPalette.Player1 },
      { p: this.layout.p2, c: ColorPalette.Player2 },
    ].map(({ p, c }) => {
      const { x, y, img, width, scale, angle, alpha } = p.ink;
      this.addSprite({
        anchor: 0.5,
        x,
        y,
        width,
        height: width,
        angle,
        scale: {
          x: scale,
          y: 1,
        },
        tint: c.szMeter.bg,
        alpha: alpha,
        texture: img,
      });

      const root = this.addContainer({
        x: p.text.x,
        y: p.text.y,
      });
      const text1 = this.addText({
        parent: root,
        anchor: 0.5,
        x: 5,
        y: 4,
        alpha: shadowAlpha,
        style: {
          fill: Color.BLACK.i32,
          fontFamily: "Splatoon1",
          fontSize: 120,
        },
      });
      text1.skew.set(skew, 0);

      const text = this.addText({
        parent: root,
        anchor: 0.5,
        style: {
          fill: c.szMeter.fg.i32,
          fontFamily: "Splatoon1",
          fontSize: 120,
        },
      });
      text.skew.set(skew, 0);

      return { root, text, text1 };
    });

    const previewRoot = this.addContainer();
    const [preview1, preview2] = [
      { p: this.layout.p1, c: ColorPalette.Player1 },
      { p: this.layout.p2, c: ColorPalette.Player2 },
    ].map(({ p, c }) => {
      const parent = this.addContainer({
        parent: previewRoot,
        x: p.text.x - 25,
        y: p.text.y + 85,
      });

      this.addSprite({
        parent,
        anchor: 0.5,
        x: 4,
        y: 4,
        width: 50,
        height: 50,
        angle: 180,
        alpha: shadowAlpha,
        tint: Color.BLACK,
        texture: "MngArrow.webp",
      });
      this.addSprite({
        parent,
        anchor: 0.5,
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        angle: 180,
        tint: c.szMeter.fg,
        texture: "MngArrow.webp",
      });

      const text1 = this.addText({
        parent,
        anchor: { x: 0, y: 0.5 },
        x: 54,
        y: 4,
        alpha: shadowAlpha,
        style: {
          fill: Color.BLACK.i32,
          fontFamily: "Splatoon1",
          fontSize: 50,
        },
      });
      text1.skew.set(skew, 0);

      const text = this.addText({
        parent,
        anchor: { x: 0, y: 0.5 },
        x: 50,
        style: {
          fill: c.szMeter.fg.i32,
          fontFamily: "Splatoon1",
          fontSize: 50,
        },
      });
      text.skew.set(skew, 0);

      return { text, text1 };
    });

    const [inkbeat1, inkbeat2] = [
      { p: this.layout.p1, c: ColorPalette.Player1 },
      { p: this.layout.p2, c: ColorPalette.Player2 },
    ].map(({ p, c }) => {
      const { x, y, angle } = p.inkbeat;
      const ib = this.addComponent(new InkBeatComponent(), {
        x,
        y,
      });
      ib.update({ color: c.primary, angle });
      return ib;
    });

    this.props.value1.onUpdate(
      (v) => (text1.text1.text = text1.text.text = `${v}`)
    );
    this.props.value2.onUpdate(
      (v) => (text2.text1.text = text2.text.text = `${v}`)
    );
    this.props.preview.onUpdate((v) => (previewRoot.visible = v));
    this.props.preview1.onUpdate(
      (v) => (preview1.text.text = preview1.text1.text = `${v}`)
    );
    this.props.preview2.onUpdate(
      (v) => (preview2.text.text = preview2.text1.text = `${v}`)
    );

    this.playFn = async (v1: number, v2: number) => {
      v1 = v1 != null ? v1 : this.props.value1.value;
      v2 = v2 != null ? v2 : this.props.value2.value;

      const dv1 = v1 - this.props.value1.value;
      const dv2 = v2 - this.props.value2.value;

      inkbeat1.update({ value: dv1 });
      inkbeat2.update({ value: dv2 });

      await Promise.all(
        [inkbeat1, inkbeat2]
          .map((ib) =>
            this.addAnimation((t) => {
              const e = EaseFunc.EASE_OUT_BACK.apply(t);
              ib.scale.set(e);
              ib.ui.alpha = 1;
            })
          )
          .map((a) => a.play(0.2))
      );

      await this.addAnimation().play(0.5);

      await Promise.all(
        [inkbeat1, inkbeat2]
          .map((ib) =>
            this.addAnimation((t) => {
              const e = 1 - EaseFunc.EASE_IN_CUBIC.apply(t);
              ib.scale.set(e);
              ib.ui.alpha = e;
            })
          )
          .map((a) => a.play(0.2))
      );

      this.update({ value1: v1, value2: v2 });

      await Promise.all(
        [text1, text2]
          .map((text) =>
            this.addAnimation((t) => {
              const e = EaseFunc.EASE_OUT_BACK.apply(t);
              text.root.scale.set(e);
            })
          )
          .map((a) => a.play(0.2))
      );
    };
  }

  async uiUpdate(v1: number, v2: number) {
    await this.playFn(v1, v2);
  }
}
