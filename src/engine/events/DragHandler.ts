import { Component } from "../Component";
import { getLogger } from "loglevel";
import { EventHandler } from "./EventHandler";

const logger = getLogger("interaction");
logger.setLevel("info");

export class DragHandler extends EventHandler {
  readonly triggerThresholdPx: number = 5;

  constructor(sender: Component) {
    super("drag", sender);
  }

  drag(pos: Coordinate) {}

  move(pos: Coordinate) {}

  drop(pos: Coordinate) {}

  _bootstrap(): EventHandler {
    const self = this;
    logger.debug("bootstrap", this);
    return Object.setPrototypeOf(
      {
        _pointerdown({ x, y }: Coordinate): EventHandler {
          if (this._pos != null) {
            return null;
          }
          this._pos = { x, y };
          return this;
        },
        _pointermove(pos: Coordinate): EventHandler {
          const d = Math.sqrt(
            (pos.x - this._pos.x) ** 2 + (pos.y - this._pos.y) ** 2
          );
          if (d >= self.triggerThresholdPx) {
            const evt: DragHandler = Object.setPrototypeOf({}, self);
            evt.drag(pos);
            return evt;
          }
          return this;
        },
        _pointerup(pos: Coordinate): EventHandler {
          return null;
        },
      },
      self
    );
  }

  _pointerdown(pos: Coordinate): EventHandler {
    this.drop(pos);
    return null;
  }

  _pointermove(pos: Coordinate): EventHandler {
    this.move(pos);
    return this;
  }

  _pointerup(pos: Coordinate): EventHandler {
    this.drop(pos);
    return null;
  }
}
