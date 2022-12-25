import { Component } from "../engine/Component";
import { CompositeTilemap } from "@pixi/tilemap";
import { Texture } from "pixi.js";
import { System } from "../engine/System";

type TextureSpec = Texture | string;
type TileSpec =
  | TextureSpec
  | {
      texture: TextureSpec;
      alpha: number;
    };

interface IGridComponentProps {
  tileset: Map<number, TileSpec>;
  matrix: IRect;
  transform: {
    dx?: number;
    dy?: number;
    rotate?: number;
    anchor?: number | ICoordinate;
    scale?: number | ICoordinate;
    alpha?: number;
  };
}

export class GridComponent extends Component<IGridComponentProps> {
  layout = {
    width: 0,
    height: 0,
  };

  constructor() {
    super({
      tileset: new Map(),
      matrix: {
        size: [0, 0],
        values: [],
      },
      transform: {},
    });

    const root = this.addContainer();
    const tilemap = new CompositeTilemap();
    root.addChild(tilemap);

    const fn = () => {
      const matrix = this.props.matrix.value;
      const transform = this.props.transform.value;
      const tileset = this.props.tileset.value;

      tilemap.clear();
      if (matrix == null) {
        return;
      }
      if (tileset.size == 0) {
        return;
      }

      let texture = tileset.values().next().value;
      if (typeof texture == "object" && !(texture instanceof Texture)) {
        texture = texture.texture;
      }
      if (typeof texture == "string") {
        texture = System.texture(texture);
      }
      const { width, height } = texture;

      const {
        size: [w, h],
        values: li,
      } = matrix;
      let { dx = width, dy = height } = transform;
      const { rotate = 0, anchor = 0, scale = 1, alpha = 1 } = transform;

      const [sx, sy] =
        typeof scale == "number" ? [scale, scale] : [scale.x, scale.y];
      root.scale.set(sx, sy);

      let [ax, ay] =
        typeof anchor == "number" ? [anchor, anchor] : [anchor.x, anchor.y];
      [ax, ay] = [width * ax, height * ay];

      [dx, dy] = [dx / sx, dy / sy];

      for (let y = 0; y < h; ++y) {
        for (let x = 0; x < w; ++x) {
          const key = li[x + y * w];
          let spec = tileset.get(key);
          if (spec == null) {
            continue;
          }
          if (spec instanceof Texture || typeof spec == "string") {
            spec = {
              texture: spec,
              alpha: 1,
            };
          }
          tilemap.tile(spec.texture, x * dx - ax, y * dy - ay, {
            tileWidth: width,
            tileHeight: height,
            rotate,
            alpha: spec.alpha * alpha,
          });
        }
      }
    };
    this.props.matrix.onUpdate(fn);
    this.props.transform.onUpdate(fn);
    this.props.tileset.onUpdate(fn);
  }
}
