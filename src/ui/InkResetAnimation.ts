import { Filter } from "pixi.js";
import { System } from "../engine/System";
import { Window } from "../engine/Window";
import InkResetGlsl from "./shaders/InkReset.glsl?raw";

class InkResetAnimation_0 extends Window {
  private readonly shader: Filter;

  private readonly velocity = 3.5;
  private readonly wavelength = 0.2;
  private readonly amplitude = this.wavelength / (2 * Math.PI);

  layout = {
    width: 1280,
    height: 720,
  };

  constructor() {
    super({});

    this.shader = this.addShader(InkResetGlsl, {
      uVelocity: this.velocity,
      uWavelength: this.wavelength,
      uAmplitude: this.amplitude,
      uPhase: 0.0,
      uTime: 0.0,
      uColorPrimary: [0.21, 0.14, 0.45],
      uColorSecondary: [0.22, 0.15, 0.46],
      uThunderPattern: System.texture("thunder_pattern.webp"),
    });

    this.bg.filters = [this.shader];

    this.ui.zIndex = 1e10;
  }

  play<T>(payload: () => Promise<T>): Promise<T> {
    this.show();

    let resolve: (val: T) => void;
    const promise = new Promise<T>((_1) => (resolve = _1));

    let done = false;
    let val: T = null;
    let t0: number = null;
    const phase0 = (t: number) => {
      this.shader.uniforms.uPhase = 0;
      if (t0 == null) {
        t0 = t;
      }
      t = (t - t0) / 1000;
      this.shader.uniforms.uTime = t;
      if (t * this.velocity > 1.1 + 2 * this.amplitude) {
        window.requestAnimationFrame((t) => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          payload().then((val1) => {
            done = true;
            val = val1;
          });
          phase1(t);
        });
      } else {
        window.requestAnimationFrame(phase0);
      }
    };
    const phase1 = (t: number) => {
      this.shader.uniforms.uPhase = 1;
      if (done) {
        t0 = null;
        window.requestAnimationFrame(phase2);
      } else {
        window.requestAnimationFrame(phase1);
      }
    };
    const phase2 = (t: number) => {
      this.shader.uniforms.uPhase = 2;
      if (t0 == null) {
        t0 = t;
      }
      t = (t - t0) / 1000;
      this.shader.uniforms.uTime = t;
      if (t * this.velocity > 1.1 + 2 * this.amplitude) {
        window.requestAnimationFrame(() => {
          this.hide();
          resolve(val);
        });
      } else {
        window.requestAnimationFrame(phase2);
      }
    };
    window.requestAnimationFrame(phase0);

    return promise;
  }
}

export const InkResetAnimation = new InkResetAnimation_0();
