import "./SquareTilemap.less";

import { getLogger } from "loglevel";

const logger = getLogger("tilemap");
logger.setLevel("info");

interface SquareTilemapProps {
  player: IPlayerId;
  rect: IRect;
  width: number;
  padding?: number;
}

const tags = [
  ["tilemap-space-p1-0", "tilemap-space-p1-1", "tilemap-space-p1-2"],
  ["tilemap-space-p2-0", "tilemap-space-p2-1", "tilemap-space-p2-2"],
];

export function SquareTilemap({
  player,
  rect,
  width,
  padding = 0,
}: SquareTilemapProps) {
  const {
    size: [w, h],
    values,
  } = rect;
  const wi = 40;
  const dx = wi + padding;
  const dy = wi + padding;

  const li = [];
  for (let y = 0; y < h; ++y) {
    for (let x = 0; x < w; ++x) {
      const i = x + w * y;
      const v = values[i];
      if (v == null) {
        continue;
      }
      li.push(
        <div
          key={i}
          className={tags[player][v]}
          style={{
            position: "absolute",
            left: x * dx,
            top: y * dy,
            width: wi,
            height: wi,
          }}
        ></div>
      );
    }
  }

  return (
    <div
      style={{
        transformOrigin: "top left",
        transform: `scale(${width / (w * dx)})`,
      }}
    >
      {li}
    </div>
  );
}
