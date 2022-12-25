import { v4 } from "uuid";
import { Component } from "../Component";

export class EventHandler {
  readonly id = v4();
  readonly stops: EventType[] = [];
  allowFire = true;

  constructor(readonly type: EventType, readonly sender: Component) {}

  get name() {
    return `${this.type}(${this.id})`;
  }

  _bootstrap(): EventHandler {
    return Object.setPrototypeOf({}, this);
  }

  _pointermove(pos: ICoordinate): EventHandler {
    return null;
  }

  _pointerdown(pos: ICoordinate): EventHandler {
    return null;
  }

  _pointerup(pos: ICoordinate): EventHandler {
    return null;
  }

  _wheel(evt: WheelEvent): EventHandler {
    return null;
  }
}
