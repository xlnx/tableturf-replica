import { EaseFunc } from "./Ease";

export class TargetAnimation<T> {
  private mUpdateFunc: (v: T) => void = () => {};
  private mTargetFunc: (v: T) => void = () => {};
  private mEaseSec = 0;
  private mEaseFunc: EaseFunc = EaseFunc.LINEAR;
  private mEaseState = { cancel: false };
  private mTargetValue: T;

  private constructor(private v: T) {
    this.mTargetValue = v;
  }

  get value() {
    return this.v;
  }

  get targetValue() {
    return this.mTargetValue;
  }

  onUpdate(func: (v: T) => void): this {
    this.mUpdateFunc = func;
    return this;
  }

  onTarget(func: (v: T) => void): this {
    this.mTargetFunc = func;
    return this;
  }

  onEase(sec: number, func: EaseFunc = EaseFunc.LINEAR): this {
    this.mEaseSec = sec;
    this.mEaseFunc = func;
    return this;
  }

  update(v1: T, sec?: number): Promise<void> {
    this.mTargetValue = v1;
    this.mTargetFunc(v1);

    this.mEaseState.cancel = true;
    this.mEaseState = { cancel: false };

    let resolve: () => void;
    const p = new Promise<void>((_resolve) => {
      resolve = _resolve;
    });

    let t0: number = null;
    if (sec == null) {
      sec = this.mEaseSec;
    }

    const { mEaseFunc, mUpdateFunc, mEaseState, v: v0 } = this;
    const fn = (t: number) => {
      let nextFn: any = () => resolve();
      if (!mEaseState.cancel) {
        if (t0 == null) {
          t0 = t;
        }
        t = (t - t0) / (1000 * sec);
        if (isNaN(t) || t >= 1) {
          this.v = v1;
        } else {
          this.v = mEaseFunc.interpolate(v0, v1, t);
          nextFn = fn;
        }
      }
      mUpdateFunc(this.v);
      window.requestAnimationFrame(nextFn);
    };
    fn(window.performance.now());

    return p;
  }

  static of<U>(value: U): TargetAnimation<U> {
    return new TargetAnimation(value);
  }
}
