import { Color } from "../engine/Color";
import { RenderBuffer } from "../engine/RenderBuffer";
import { Texture } from "pixi.js";
import { ColorPalette } from "./ColorPalette";
import { System } from "../engine/System";
import SpFireGlsl from "./shaders/SpFire.glsl?raw";

interface ISpFireTextureProps {
  primary: Color;
  secondary: Color;
  center: Color;
}

export class SpFireTexture extends RenderBuffer<ISpFireTextureProps> {
  layout = {
    width: 104,
    height: 104,
    center: {
      x: 52,
      y: 68,
      r: 15,
    },
  };

  constructor(props: ISpFireTextureProps) {
    super(props);

    const shader = this.addShader(SpFireGlsl, {
      uColorPrimary: Color.BLACK.rgb01,
      uColorSecondary: Color.BLACK.rgb01,
      uAlphaSampler: System.texture("SpFire_00.webp"),
      uFlameSampler: System.texture("SpFire_01.webp"),
      uDistortionSampler: System.texture("SpFire_02.webp"),
    });

    const {
      width,
      height,
      center: { x, y, r },
    } = this.layout;

    this.addSprite({
      width,
      height,
      filters: [shader],
    });

    const circle = this.addSprite({
      anchor: 0.5,
      x,
      y,
      width: r * 2,
      height: r * 2,
      texture: "circle.webp",
    });

    this.props.primary.onUpdate(
      (v) => (shader.uniforms.uColorPrimary = v.rgb01)
    );
    this.props.secondary.onUpdate(
      (v) => (shader.uniforms.uColorSecondary = v.rgb01)
    );
    this.props.center.onUpdate((v) => (circle.tint = v.i32));
  }

  static readonly P1: Texture = new SpFireTexture(ColorPalette.Player1.fire)
    .texture;

  static readonly P2: Texture = new SpFireTexture(ColorPalette.Player2.fire)
    .texture;
}
