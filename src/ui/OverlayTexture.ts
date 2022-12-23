import { Color } from "../engine/Color";
import { RenderBuffer } from "../engine/RenderBuffer";
import { Texture } from "pixi.js";
import { ColorPalette } from "./ColorPalette";
import { System } from "../engine/System";
import SpaceOverlayGlsl from "./shaders/SpaceOverlay.glsl?raw";

interface IOverlayComponentProps {
  value: number;
  scale: number;
  angle: number;
  angleV: number;
  primary: Color;
  secondary: Color;
  file: string;
}

export class OverlayTexture extends RenderBuffer<IOverlayComponentProps> {
  layout = {
    width: 40,
    height: 40,
  };

  constructor(props: IOverlayComponentProps) {
    super(props);

    const shader = this.addShader(SpaceOverlayGlsl, {
      uValue: 0,
      uScale: 0,
      uAngle: 0,
      uAngleV: 0,
      uColorPrimary: Color.BLACK.rgb01,
      uColorSecondary: Color.BLACK.rgb01,
      uPatternSampler: Texture.WHITE,
    });

    const { width, height } = this.layout;
    this.addSprite({
      width,
      height,
      filters: [shader],
    });

    this.props.value.onUpdate((v) => (shader.uniforms.uValue = v));
    this.props.scale.onUpdate((v) => (shader.uniforms.uScale = v));
    this.props.angle.onUpdate((v) => (shader.uniforms.uAngle = v));
    this.props.angleV.onUpdate((v) => (shader.uniforms.uAngleV = v));
    this.props.primary.onUpdate(
      (v) => (shader.uniforms.uColorPrimary = v.rgb01)
    );
    this.props.secondary.onUpdate(
      (v) => (shader.uniforms.uColorSecondary = v.rgb01)
    );
    this.props.file.onUpdate(
      (file) => (shader.uniforms.uPatternSampler = System.texture(file))
    );
  }

  static normal(): OverlayTexture {
    return new OverlayTexture({
      value: 1,
      scale: 0.8,
      angle: 45,
      angleV: -180,
      primary: ColorPalette.Space.overlay.normal,
      secondary: ColorPalette.Space.overlay.invalid,
      file: "guide_stride.webp",
    });
  }

  static special(): OverlayTexture {
    return new OverlayTexture({
      value: 1,
      scale: 1.2,
      angle: -75,
      angleV: -150,
      primary: ColorPalette.Space.overlay.special,
      secondary: ColorPalette.Space.overlay.invalid,
      file: "guide_dot_01.webp",
    });
  }
}
