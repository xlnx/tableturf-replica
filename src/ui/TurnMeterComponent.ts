import { Color } from "../engine/Color";
import { Component } from "../engine/Component";
import { EaseFunc } from "../engine/animations/Ease";

interface ITimerComponentProps {
  value: number;
}

const shadowAlpha = 0.3;

export class TurnMeterComponent extends Component<ITimerComponentProps> {
  layout = {
    width: 0,
    height: 0,
  };

  private readonly updateFn: (v: number) => Promise<void>;

  constructor() {
    super({
      value: 0,
    });

    const root = this.addContainer();

    const bgRoot = this.addContainer({ parent: root });

    const shadow = this.addGraphics({ parent: bgRoot, x: 4, y: 5 })
      .beginFill(Color.BLACK.i32)
      .drawCircle(0, 0, 90);
    shadow.alpha = shadowAlpha;

    this.addText({
      parent: bgRoot,
      anchor: 0.5,
      x: 2,
      y: -52,
      text: "Turns Left",
      alpha: shadowAlpha,
      style: {
        fill: Color.BLACK.i32,
        fontFamily: "Splatoon1",
        fontSize: 28,
      },
    });
    this.addText({
      parent: bgRoot,
      anchor: 0.5,
      x: 0,
      y: -54,
      text: "Turns Left",
      style: {
        fill: Color.fromHex(0xd0d0d0).i32,
        fontFamily: "Splatoon1",
        fontSize: 28,
      },
    });

    this.lock(bgRoot);

    const counterRoot = this.addContainer({ parent: root });
    const counter1 = this.addText({
      parent: counterRoot,
      anchor: 0.5,
      x: 8,
      y: 8,
      text: "0",
      alpha: shadowAlpha,
      style: {
        fill: Color.BLACK.i32,
        fontFamily: "Splatoon1",
        fontSize: 76,
      },
    });
    const counter = this.addText({
      parent: counterRoot,
      anchor: 0.5,
      x: 0,
      y: 0,
      text: "0",
      style: {
        fontFamily: "Splatoon1",
        fontSize: 76,
      },
    });

    this.props.value.onUpdate((v) => {
      counter.style.fill =
        v <= 3 ? Color.fromHex(0xf04833).i32 : Color.WHITE.i32;
      counter1.text = counter.text = `${v}`;
    });

    this.updateFn = async (v) => {
      const h = 20;
      const dt = 0.05;

      const a2 = this.addAnimation((t) => {
        const e = EaseFunc.EASE_OUT_CUBIC.apply(t);
        counterRoot.y = EaseFunc.LINEAR.interpolate(0, -h, e);
      });

      const a3 = this.addAnimation((t) => {
        const e = EaseFunc.EASE_IN_CUBIC.apply(t);
        counterRoot.y = EaseFunc.LINEAR.interpolate(-h, 0, e);
      });

      await a2.play(dt);
      this.update({ value: v });
      await a3.play(dt);
    };
  }

  async uiUpdate(value: number) {
    await this.updateFn(value);
  }
}
