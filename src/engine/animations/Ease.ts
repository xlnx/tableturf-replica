import BezierEasing from "bezier-easing";
import { Color } from "../Color";

type F = (t: number) => number;

export class EaseFunc {
  constructor(private readonly _func: F) {}

  apply(t: number): number {
    return this._func(t);
  }

  interpolate(_v1: any, _v2: any, t: number): any {
    const a: any = _v1;
    const b: any = _v2;
    t = Math.max(0, Math.min(1, t));
    if (a instanceof Color) {
      return Color.fromRgb01(this.interpolate(a.rgb01, b.rgb01, t));
    } else if (Array.isArray(a)) {
      console.assert(a.length == b.length);
      return a.map((x, i) => this.interpolate(x, b[i], t));
    } else {
      return a + (b - a) * this._func(t);
    }
  }

  static cubicBezier(x1: number, y1: number, x2: number, y2: number) {
    return new EaseFunc(BezierEasing(x1, y1, x2, y2));
  }

  static readonly LINEAR = new EaseFunc((t) => t);

  static readonly EASE_IN_SINE = EaseFunc.cubicBezier(0.12, 0, 0.39, 0);
  static readonly EASE_OUT_SINE = EaseFunc.cubicBezier(0.61, 1, 0.88, 1);
  static readonly EASE_IN_OUT_SINE = EaseFunc.cubicBezier(0.37, 0, 0.63, 1);

  static readonly EASE_IN_QUAD = EaseFunc.cubicBezier(0.11, 0, 0.5, 0);
  static readonly EASE_OUT_QUAD = EaseFunc.cubicBezier(0.5, 1, 0.89, 1);
  static readonly EASE_IN_OUT_QUAD = EaseFunc.cubicBezier(0.45, 0, 0.55, 1);

  static readonly EASE_IN_CUBIC = EaseFunc.cubicBezier(0.32, 0, 0.67, 0);
  static readonly EASE_OUT_CUBIC = EaseFunc.cubicBezier(0.33, 1, 0.68, 1);
  static readonly EASE_IN_OUT_CUBIC = EaseFunc.cubicBezier(0.65, 0, 0.35, 1);

  static readonly EASE_IN_QUART = EaseFunc.cubicBezier(0.5, 0, 0.75, 0);
  static readonly EASE_OUT_QUART = EaseFunc.cubicBezier(0.25, 1, 0.5, 1);
  static readonly EASE_IN_OUT_QUART = EaseFunc.cubicBezier(0.76, 0, 0.24, 1);

  static readonly EASE_IN_QUINT = EaseFunc.cubicBezier(0.64, 0, 0.78, 0);
  static readonly EASE_OUT_QUINT = EaseFunc.cubicBezier(0.22, 1, 0.36, 1);
  static readonly EASE_IN_OUT_QUINT = EaseFunc.cubicBezier(0.83, 0, 0.17, 1);

  static readonly EASE_IN_EXPO = EaseFunc.cubicBezier(0.7, 0, 0.84, 0);
  static readonly EASE_OUT_EXPO = EaseFunc.cubicBezier(0.16, 1, 0.3, 1);
  static readonly EASE_IN_OUT_EXPO = EaseFunc.cubicBezier(0.87, 0, 0.13, 1);

  static readonly EASE_IN_CIRC = EaseFunc.cubicBezier(0.55, 0, 1, 0.45);
  static readonly EASE_OUT_CIRC = EaseFunc.cubicBezier(0, 0.55, 0.45, 1);
  static readonly EASE_IN_OUT_CIRC = EaseFunc.cubicBezier(0.85, 0, 0.15, 1);

  static readonly EASE_IN_BACK = EaseFunc.cubicBezier(0.36, 0, 0.66, -0.56);
  static readonly EASE_OUT_BACK = EaseFunc.cubicBezier(0.34, 1.56, 0.64, 1);
  static readonly EASE_IN_OUT_BACK = EaseFunc.cubicBezier(
    0.68,
    -0.6,
    0.32,
    1.6
  );

  static viscousFluid(scale: number = 8) {
    const invE = Math.exp(-1);
    const fn = (x: number) => {
      x *= scale;
      if (x < 1) {
        x -= 1 - Math.exp(-x);
      } else {
        x = 1 - Math.exp(1 - x);
        x = invE + x * (1 - invE);
      }
      return x;
    };
    const VISCOUS_FLUID_NORMALIZE = 1 / fn(1);
    const VISCOUS_FLUID_OFFSET = 1 - VISCOUS_FLUID_NORMALIZE * fn(1);
    return new EaseFunc((t: number) => {
      t = VISCOUS_FLUID_NORMALIZE * fn(t);
      if (t > 0) {
        return t + VISCOUS_FLUID_OFFSET;
      }
      return t;
    });
  }

  static readonly VISCOUS_FLUID = this.viscousFluid();
}
