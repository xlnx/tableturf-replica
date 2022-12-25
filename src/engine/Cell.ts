import { EaseFunc } from "./animations/Ease";

export class Cell<T> {
  private mUpdateFunc: (v: T, v0: T) => void = () => {};

  private constructor(public value: T) {}

  onUpdate(func: (v: T, v0: T) => void): this {
    this.mUpdateFunc = func;
    return this;
  }

  /**
   * @deprecated
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEase(sec: number, func: EaseFunc = EaseFunc.LINEAR): this {
    return this;
  }

  update(v: T) {
    const v0 = this.value;
    this.value = v;
    this.mUpdateFunc(v, v0);
  }

  static of<U>(value: U): Cell<U> {
    return new Cell(value);
  }
}
