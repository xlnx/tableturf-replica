import { Filter } from "pixi.js";
import { Color } from "../engine/Color";
import { Component, Shader } from "../engine/Component";
import { EaseFunc } from "../engine/animations/Ease";
import { PointerHandler } from "../engine/events/PointerHandler";
import { PulseAnimation } from "../engine/animations/PulseAnimation";
import { RenderBuffer } from "../engine/RenderBuffer";
import { TargetAnimation } from "../engine/animations/TargetAnimation";
import { System } from "../engine/System";
import { Cell } from "../engine/Cell";
import HoverGlowGlsl from "./shaders/HoverGlow.glsl?raw";

class HoverGlowTexture extends RenderBuffer {
  layout = {
    width: 128,
    height: 128,
  };

  private shader: Filter;

  constructor() {
    super({});

    this.shader = this.addShader(HoverGlowGlsl, {
      uTime0: 0,
      uLightDsSampler: System.texture("LightDS_00.webp"),
      uGlowSampler: System.texture("GrdFresh_00.webp"),
    });

    const { width, height } = this.layout;

    this.addSprite({
      width,
      height,
      filters: [this.shader],
    });
  }

  reset() {
    this.shader.uniforms.uTime0 = Shader.time();
  }

  static readonly V = new HoverGlowTexture();
}

type CardInteractionsInternalState = "disabled" | "normal" | "hover";

interface ICardInteractionsOptions {
  radius: number;
}

export class CardInteractions {
  readonly on = Cell.of(true);
  readonly disabled = Cell.of(false);
  readonly selected = Cell.of(false);

  private onTapFn: () => void = () => {};

  onTap(onTapFn?: () => void) {
    this.onTapFn = onTapFn || (() => {});
  }

  private constructor(
    public readonly obj: Component,
    options?: ICardInteractionsOptions
  ) {
    const self = this;
    const { radius = 0 } = options || {};

    obj.anchor.set(0.5);

    const { width, height } = obj.layout;

    const overlay = obj
      .addGraphics()
      .beginFill(Color.WHITE.i32)
      .drawRoundedRect(0, 0, width, height, radius);
    overlay.alpha = 0;

    const overlay1 = obj
      .addGraphics()
      .beginFill(Color.BLACK.i32)
      .drawRoundedRect(0, 0, width, height, radius);
    overlay1.alpha = 0;

    const glow = obj.addSprite({
      width,
      height,
      texture: HoverGlowTexture.V.texture,
    });
    glow.mask = obj
      .addGraphics()
      .beginFill(Color.WHITE.i32)
      .drawRoundedRect(0, 0, width, height, radius);
    glow.visible = false;

    const cardTilt = TargetAnimation.of(0)
      .onEase(0.15, EaseFunc.EASE_IN_OUT_EXPO)
      .onUpdate((v) => (obj.angle = v));

    const overlayAlpha = TargetAnimation.of(0)
      .onEase(0.3, EaseFunc.EASE_IN_OUT_EXPO)
      .onUpdate((v) => (overlay.alpha = v));

    const overlayAlpha1 = TargetAnimation.of(0)
      .onEase(0.3, EaseFunc.EASE_IN_OUT_EXPO)
      .onUpdate((v) => (overlay1.alpha = v));

    const cardClickAnim = new PulseAnimation({
      from: 1,
      to: 1.04,
      time: 0.15,
      update: (v) => obj.scale.set(v),
    });

    const state = Cell.of<CardInteractionsInternalState>("normal").onUpdate(
      (s, s0) => {
        if (s0 == s) {
          return;
        }
        switch (s) {
          case "normal":
            {
              cardTilt.update(0);
              overlayAlpha.update(0);
              overlayAlpha1.update(0);
              glow.visible = false;
            }
            break;
          case "hover":
            {
              cardTilt.update(-2);
              overlayAlpha.update(0.2);
              overlayAlpha1.update(0);
              HoverGlowTexture.V.reset();
              glow.visible = true;
            }
            break;
          case "disabled":
            {
              cardTilt.update(0);
              overlayAlpha.update(0);
              overlayAlpha1.update(0.5);
              glow.visible = false;
            }
            break;
        }
      }
    );

    let hover = false;
    const interaction = obj.handle(
      class extends PointerHandler {
        stops: EventType[] = ["pointer"];

        enter(pos: Coordinate): void {
          hover = true;
          if (!self.disabled.value) {
            state.update("hover");
          }
        }

        move(pos: Coordinate): void {
          if (!self.disabled.value) {
            state.update("hover");
          }
        }

        leave(pos: Coordinate): void {
          hover = false;
          if (!self.selected.value && !self.disabled.value) {
            state.update("normal");
          }
        }

        tap(pos: Coordinate): void {
          if (!self.disabled.value) {
            cardClickAnim.send();
            self.onTapFn();
          }
        }
      }
    );

    this.on.onUpdate((ok, ok0) => {
      if (ok != ok0) {
        interaction.toggle(ok);
        state.update(
          this.disabled.value ? "disabled" : hover ? "hover" : "normal"
        );
      }
    });
    this.disabled.onUpdate((ok, ok0) => {
      if (ok != ok0) {
        state.update(ok ? "disabled" : hover ? "hover" : "normal");
      }
    });
    this.selected.onUpdate((ok, ok0) => {
      if (ok != ok0) {
        state.update(
          this.disabled.value ? "disabled" : ok || hover ? "hover" : "normal"
        );
      }
    });
  }

  static install<T extends {}>(
    self: Component<T>,
    options?: ICardInteractionsOptions
  ): CardInteractions {
    return new CardInteractions(self as any, options);
  }
}
