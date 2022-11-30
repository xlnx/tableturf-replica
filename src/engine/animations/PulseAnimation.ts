import { EaseFunc } from "./Ease";

interface IPulseAnimationOptions {
  from?: number;
  to: number;
  time?: number;
  ease?: EaseFunc;
  update: (t: number) => void;
}

export class PulseAnimation {
  private readonly opts: IPulseAnimationOptions;
  private v: number;

  private mEaseState = { cancel: false };

  constructor(options: IPulseAnimationOptions) {
    this.opts = Object.assign(
      {},
      {
        from: 0,
        time: 0.2,
        ease: EaseFunc.EASE_OUT_CUBIC,
      },
      options
    );
    this.v = this.opts.from;
  }

  send(): Promise<void> {
    this.mEaseState.cancel = true;
    this.mEaseState = { cancel: false };

    let resolve: () => void;
    const p = new Promise<void>((_resolve) => {
      resolve = _resolve;
    });

    const {
      mEaseState,
      opts: { update: keyframe, ease },
    } = this;

    const v0 = this.v;
    const v1 = this.opts.to;
    const v2 = this.opts.from;
    const dt2 = this.opts.time / 2;
    const dt1 = (Math.abs(v1 - v0) / Math.abs(v2 - v1)) * dt2;
    const dt = dt1 + dt2;

    let t0 = window.performance.now();
    const fn = (t: number) => {
      if (mEaseState.cancel) {
        resolve();
        return;
      }
      const dts = (t - t0) / 1000;
      if (dts >= dt) {
        this.v = v2;
        keyframe(this.v);
        resolve();
        return;
      }
      if (dts < dt1) {
        this.v = ease.interpolate(v0, v1, dts / dt1);
      } else {
        this.v = ease.interpolate(v2, v1, 1 - (dts - dt1) / dt2);
      }
      keyframe(this.v);
      window.requestAnimationFrame(fn);
    };
    fn(t0);

    return p;
  }
}
