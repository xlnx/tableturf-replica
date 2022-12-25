export type KeyFrameFuncType = (v: number) => void;

export interface IAnimationOptions {
  time?: number;
  // reset?: () => void;
  keyframe?: KeyFrameFuncType;
}

export class Animation {
  private state = { cancel: false };
  private readonly opts: IAnimationOptions;

  constructor(options: IAnimationOptions | KeyFrameFuncType) {
    if (options instanceof Function) {
      options = { keyframe: options };
    }
    this.opts = Object.assign({}, { time: 0, keyframe: () => {} }, options);
  }

  reset() {
    this.opts.keyframe(0);
  }

  play(dt?: number): Promise<void> {
    this.state.cancel = true;
    this.state = { cancel: false };

    let resolve: () => void;
    const p = new Promise<void>((_resolve) => {
      resolve = _resolve;
    });

    let t0: number = null;
    const { state } = this;
    let { time, keyframe } = this.opts; // eslint-disable-line prefer-const
    if (dt != null) {
      time = dt;
    }
    const fn = (t: number) => {
      let nextFn: any = resolve;
      if (!state.cancel) {
        if (t0 == null) {
          t0 = t;
        }
        t = (t - t0) / (1000 * time);
        if (isNaN(t) || t >= 1) {
          keyframe(1);
          // reset();
        } else {
          keyframe(t);
          nextFn = fn;
        }
      }
      window.requestAnimationFrame(nextFn);
    };
    // reset();
    fn(window.performance.now());

    return p;
  }
}
