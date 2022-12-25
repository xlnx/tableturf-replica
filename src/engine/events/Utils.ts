import { DisplayObject, Point, Sprite } from "pixi.js";
import { Component } from "../Component";
import { PixiRootContainer } from "../System";

function getGlobalBBox(obj: Component | Sprite): number[] {
  if (obj instanceof Sprite) {
    return (<any>obj).vertexData;
  }
  const { width: x, height: y } = obj.layout;
  const ui: DisplayObject = (<any>obj).ui2;
  const li = [];
  const pt = new Point(0, 0);
  ui.worldTransform.apply(pt, pt);
  li[0] = pt.x;
  li[1] = pt.y;
  pt.copyFrom({ x, y: 0 });
  ui.worldTransform.apply(pt, pt);
  li[2] = pt.x;
  li[3] = pt.y;
  // pt.copyFrom({ x, y });
  // ui.worldTransform.applyInverse(pt, pt);
  // li[4] = pt.x;
  // li[5] = pt.y;
  pt.copyFrom({ x: 0, y });
  ui.worldTransform.apply(pt, pt);
  li[6] = pt.x;
  li[7] = pt.y;
  return li;
}

export function getLocalPos(
  pos: ICoordinate,
  obj: Component | Sprite
): ICoordinate {
  const v = getGlobalBBox(obj);
  let { x, y } = pos;
  [x, y] = [x - v[0], y - v[1]];
  const [x1, y1] = [v[2] - v[0], v[3] - v[1]];
  const [x2, y2] = [v[6] - v[0], v[7] - v[1]];
  const x2_y1_x1_y2 = x2 * y1 - x1 * y2;
  return {
    x: (x2 * y - x * y2) / x2_y1_x1_y2,
    y: (x * y1 - x1 * y) / x2_y1_x1_y2,
  };
}

export function getWorldPos(
  pos: ICoordinate,
  obj: Component | Sprite
): ICoordinate {
  const v = getGlobalBBox(obj);
  const { x, y } = pos;
  const [x1, y1] = [v[2] - v[0], v[3] - v[1]];
  const [x2, y2] = [v[6] - v[0], v[7] - v[1]];
  return {
    x: x * x1 + y * x2 + v[0],
    y: x * y1 + y * y2 + v[1],
  };
}

function isAttached(obj: DisplayObject) {
  while (obj != null) {
    if (obj instanceof PixiRootContainer) {
      return true;
    }
    obj = obj.parent;
  }
  return false;
}

export function hitTest(pos: ICoordinate, obj: Component) {
  if (!obj.visible) {
    return false;
  }
  const e: DisplayObject = (<any>obj).ui2;
  if (!isAttached(e)) {
    return false;
  }
  if (!e.hitArea) {
    return false;
  }
  const pt = new Point(pos.x, pos.y);
  e.worldTransform.applyInverse(pt, pt);
  return e.hitArea.contains(pt.x, pt.y);
}
