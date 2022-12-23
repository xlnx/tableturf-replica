import { Component } from "../Component";
import { EventHandler } from "./EventHandler";

export class WheelHandler extends EventHandler {
  constructor(sender: Component) {
    super("wheel", sender);
  }

  wheel(pos: Coordinate, dy: number) {}

  _wheel(evt: WheelEvent): EventHandler {
    this.wheel(evt, evt.deltaY);
    return null;
  }
}
