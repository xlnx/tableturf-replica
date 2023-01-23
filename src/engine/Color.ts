import { hex2rgb, string2hex } from "@pixi/utils";

export class Color {
  private constructor(private readonly _rgb: number[]) {}

  get hex(): string {
    const f = (x: number) => ("00" + x.toString(16)).slice(-2);
    return this.rgb255.map(f).join("");
  }

  get hexSharp(): string {
    return `#${this.hex}`;
  }

  get i32(): number {
    const [r, g, b] = this.rgb255;
    return (r << 16) | (g << 8) | b;
  }

  get rgb01(): number[] {
    return this._rgb.slice();
  }

  get rgb255(): number[] {
    return this._rgb.map((x) =>
      Math.max(0, Math.min(255, Math.round(x * 255)))
    );
  }

  darken(percent: number) {
    return Color.fromRgb01(this._rgb.map((e) => e * (1 - percent)));
  }

  static fromRgb01(rgb: number[]) {
    console.assert(rgb.length == 3);
    return new Color(rgb.slice());
  }

  static fromRgb255(rgb: number[]) {
    console.assert(rgb.length == 3);
    return Color.fromRgb01(rgb.map((x) => Math.max(0, Math.min(1, x / 255))));
  }

  static fromHex(hex: string | number) {
    if (typeof hex == "string") {
      hex = string2hex(<any>hex);
    }
    return Color.fromRgb01(Array.from(hex2rgb(<any>hex)));
  }

  static readonly BLACK = Color.fromHex(0x0);
  static readonly WHITE = Color.fromHex(0xffffff);
}
