import "./SquareTilemap.less";

import { getLogger } from "loglevel";
import { System } from "../../engine/System";
import { Base64String } from "./Base64String";

const logger = getLogger("tilemap");
logger.setLevel("info");

interface SquareTilemapProps {
  id: string;
  player: IPlayerId;
  rect: IRect;
  width: number;
  padding?: number;
}

function loadImage(path: string) {
  const texture = System.texture(path);
  const resource = texture.baseTexture.resource as any;
  return resource.source;
}

const imgs = [
  [
    {
      image: loadImage("empty_space.webp"),
      alpha: 0.7,
    },
    {
      image: loadImage("player1_trivial_space.webp"),
    },
    {
      image: loadImage("player1_special_space.webp"),
    },
  ],
  [
    {
      image: loadImage("empty_space.webp"),
      alpha: 0.7,
    },
    {
      image: loadImage("player2_trivial_space.webp"),
    },
    {
      image: loadImage("player2_special_space.webp"),
    },
  ],
];

const canvas = document.createElement("canvas");

export function SquareTilemap({
  id,
  player,
  rect,
  width,
  padding = 0,
}: SquareTilemapProps) {
  const {
    size: [w, h],
    values,
  } = rect;
  const wi = 24;
  const dx = wi * (1 + padding);
  const dy = wi * (1 + padding);

  let base64: string;
  const img = window.localStorage.getItem(id);
  if (img) {
    base64 = Base64String.decompressFromUTF16(img);
  } else {
    canvas.width = w * dx;
    canvas.height = h * dy;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        const i = x + w * y;
        const v = values[i];
        if (v == null) {
          continue;
        }
        const { image, alpha } = imgs[player][v];
        ctx.globalAlpha = alpha;
        ctx.drawImage(image, x * dx, y * dy, wi, wi);
        ctx.globalAlpha = 1;
      }
    }
    base64 = canvas.toDataURL("image/webp").split(",")[1];
    try {
      window.localStorage.setItem(id, Base64String.compressToUTF16(base64));
    } catch (err) {
      //
    }
  }

  return (
    <svg width={width} height={(h / w) * width}>
      <image
        className={`tilemap tilemap-${id}`}
        width={w * dx}
        height={h * dy}
        xlinkHref={`data:image/webp;base64,${base64}`}
        preserveAspectRatio="none"
        transform={`scale(${width / (dx * w)})`}
      ></image>
    </svg>
  );
}
