import { Component } from "../engine/Component";
import { EaseFunc } from "../engine/animations/Ease";
import { ColorPalette } from "./ColorPalette";
import { Color } from "../engine/Color";
import { Card } from "../core/Tableturf";
import { System } from "../engine/System";
import BgMotionGlsl from "./shaders/BgMotion.glsl?raw";
import SpCutInImgGlsl from "./shaders/SpCutInImg.glsl?raw";

interface ISpCutInAnimationProps {
  card1: Card | null;
  card2: Card | null;
}

export class SpCutInAnimation extends Component<ISpCutInAnimationProps> {
  layout = {
    width: 1920,
    height: 1080,
    cutin: {
      width: 400,
      height: 700,
      dx: 28,
      dy: 20,
      img: {
        width: 365,
        height: 512,
        dx: 10,
        dy: 8,
      },
      p1: {
        x: 880,
        y: 700,
        ink1: {
          x: -4,
          y: -210,
          width: 400,
          height: 400,
          angle: 60,
          img: "Ink_02.webp",
        },
        ink2: {
          x: 110,
          y: 194,
          width: 200,
          height: 200,
          angle: 0,
          img: "InkNormal_00.webp",
        },
        img: {
          y0: 100,
          y1: -50,
        },
      },
      p2: {
        x: 1320,
        y: 260,
        ink1: {
          x: 53,
          y: -211,
          width: 200,
          height: 200,
          angle: -120,
          img: "InkNormal_00.webp",
        },
        ink2: {
          x: 17,
          y: 228,
          width: 400,
          height: 400,
          angle: -120,
          img: "Ink_02.webp",
        },
        img: {
          y0: -100,
          y1: 50,
        },
      },
    },
  };

  private anims: (() => Promise<any>)[] = [];

  constructor() {
    super({
      card1: null,
      card2: null,
    });

    const { width, height, dx, dy, p1, p2 } = this.layout.cutin;

    const parent = this.addContainer({
      y: 18,
    });

    for (const { p, c, card } of [
      { p: p1, c: ColorPalette.Player1.spCutIn, card: this.props.card1 },
      { p: p2, c: ColorPalette.Player2.spCutIn, card: this.props.card2 },
    ]) {
      const bgShader = this.addShader(BgMotionGlsl, {
        uColorFgPrimary: c.fg.primary.rgb01,
        uColorFgSecondary: c.fg.secondary.rgb01,
        uColorBg: c.bg.rgb01,
        uPatternSampler: System.texture("thunder_pattern.webp"),
        uSpeed: 1.5,
        uAngle: -20,
        uScale: 1,
      });

      const imgShader = this.addShader(SpCutInImgGlsl, {
        uColor: c.img.rgb01,
      });

      const ciRoot = this.addContainer({
        parent,
        x: p.x,
        y: p.y,
      });
      const ci1 = this.addSprite({
        parent: ciRoot,
        x: -width / 2 + dx,
        y: -height / 2 + dy,
        width,
        height,
        texture: "CutIn.webp",
      });
      ci1.tint = 0x1f1f1f;
      ci1.alpha = 0.7;
      const ci = this.addSprite({
        parent: ciRoot,
        x: -width / 2,
        y: -height / 2,
        width,
        height,
        texture: "CutIn.webp",
        filters: [bgShader],
      });

      const fn = (layout: any) => {
        const inkRoot = this.addContainer({
          parent: ciRoot,
          x: layout.x,
          y: layout.y,
        });
        const inkRoot1 = this.addContainer({
          parent: inkRoot,
          angle: layout.angle,
        });
        const ink = this.addSprite({
          parent: inkRoot1,
          x: -layout.width / 2,
          y: -layout.height / 2,
          width: layout.width,
          height: layout.height,
          texture: layout.img,
        });
        ink.tint = c.ink.i32;
        return inkRoot;
      };

      const ink1 = fn(p.ink1);
      const ink2 = fn(p.ink2);

      const imgLayout = this.layout.cutin.img;
      const imgRoot = this.addContainer({
        parent: ciRoot,
      });
      const imgRoot1 = this.addContainer({
        parent: imgRoot,
      });
      imgRoot1.scale.set(1.2);
      const img1 = this.addSprite({
        parent: imgRoot1,
        x: -imgLayout.width / 2 + imgLayout.dx,
        y: -imgLayout.height / 2 + imgLayout.dy,
        width: imgLayout.width,
        height: imgLayout.height,
        filters: [imgShader],
      });
      const img = this.addSprite({
        parent: imgRoot1,
        x: -imgLayout.width / 2,
        y: -imgLayout.height / 2,
        width: imgLayout.width,
        height: imgLayout.height,
      });

      card.onUpdate((v) => {
        if (v != null) {
          ciRoot.visible = true;
          img1.texture = img.texture = System.texture(v.render.bg);
        } else {
          ciRoot.visible = false;
        }
      });

      const a1 = this.addAnimation((t) => {
        let e = EaseFunc.EASE_OUT_BACK.apply(t);
        ciRoot.scale.x = e;

        e = EaseFunc.LINEAR.apply(t);
        imgRoot.alpha = e;
        imgRoot.y = EaseFunc.LINEAR.interpolate(p.img.y0, 0, e);
        img.tint = EaseFunc.LINEAR.interpolate(c.img, Color.WHITE, e).i32;
      });

      const a2 = this.addAnimation((t) => {
        ink1.scale.set(EaseFunc.EASE_OUT_BACK.apply(t));
      });

      const a3 = this.addAnimation((t) => {
        ink2.scale.set(EaseFunc.EASE_OUT_BACK.apply(t));
      });

      const a4 = this.addAnimation((t) => {
        let e = EaseFunc.EASE_IN_CUBIC.apply(t);
        ciRoot.scale.x = 1 - e;
        ciRoot.alpha = 1 - e;
        e = EaseFunc.LINEAR.apply(t);
        imgRoot.alpha = 1 - e;
        imgRoot.y = EaseFunc.LINEAR.interpolate(0, p.img.y1, e);
        img.tint = EaseFunc.LINEAR.interpolate(Color.WHITE, c.img, e).i32;
      });

      const sleep = (t: number) =>
        this.addAnimation({
          time: t,
        }).play();

      const anim = async () => {
        ciRoot.scale.x = 0;
        ciRoot.alpha = 1;
        ink1.scale.set(0);
        ink2.scale.set(0);
        imgRoot.alpha = 0;
        await Promise.all([
          a1.play(0.2),
          sleep(0.1).then(() => {
            return Promise.all([
              a2.play(0.1),
              sleep(0.05).then(() => {
                return a3.play(0.1);
              }),
            ]);
          }),
        ]);
        await sleep(1.5);
        await a4.play(0.2);
      };

      this.anims.push(anim);
    }
  }

  uiPlay(card1?: Card, card2?: Card): Promise<any> {
    this.update({ card1, card2 });
    return Promise.all(this.anims.map((f) => f()));
  }
}
