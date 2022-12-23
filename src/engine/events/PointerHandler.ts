import { Component } from "../Component";
import { EventHandler } from "./EventHandler";
import { hitTest } from "./Utils";

export class PointerHandler extends EventHandler {
  readonly triggerThresholdPx: number = 5;
  readonly doubleTapThresholdMs: number = 500;

  private _first: boolean = true;
  private _pos: Coordinate = null;
  private _lastTapTime: number = null;

  constructor(sender: Component) {
    super("pointer", sender);
  }

  enter(pos: Coordinate) {}

  move(pos: Coordinate) {}

  down(pos: Coordinate) {}

  up(pos: Coordinate) {}

  tap(pos: Coordinate) {}

  doubleTap(pos: Coordinate) {}

  leave(pos: Coordinate) {}

  _pointermove(pos: Coordinate): EventHandler {
    if (!hitTest(pos, this.sender)) {
      return this._pointerout(pos);
    }
    if (this._first) {
      this._first = false;
      this.enter(pos);
    } else {
      this.move(pos);
    }
    return this;
  }

  _pointerout(pos: Coordinate): EventHandler {
    this.leave(pos);
    return null;
  }

  _pointerdown(pos: Coordinate): EventHandler {
    if (!hitTest(pos, this.sender)) {
      return this._pointerout(pos);
    }
    this.down(pos);
    if (this._pos == null) {
      this._pos = { x: pos.x, y: pos.y };
    }
    return this;
  }

  _pointerup(pos: Coordinate): EventHandler {
    if (!hitTest(pos, this.sender)) {
      return this._pointerout(pos);
    }
    this.up(pos);
    if (this._pos != null) {
      const d = Math.sqrt(
        (pos.x - this._pos.x) ** 2 + (pos.y - this._pos.y) ** 2
      );
      this._pos = null;
      if (d < this.triggerThresholdPx) {
        this.tap(pos);
        const time = performance.now();
        if (
          this._lastTapTime != null &&
          time - this._lastTapTime < this.doubleTapThresholdMs
        ) {
          this.doubleTap(pos);
          this._lastTapTime = null;
        } else {
          this._lastTapTime = time;
        }
      }
    }
    // if (System.isMobile) {
    //   return this._pointerout(pos);
    // }
    return this;
  }
}
