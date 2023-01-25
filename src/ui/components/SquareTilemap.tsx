import { getLogger } from "loglevel";
import { System } from "../../engine/System";

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
const tilemapCache = new Map<string, string>();

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
  const dx = wi + padding;
  const dy = wi + padding;

  let url = tilemapCache.get(id);
  if (!url) {
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
    url = canvas.toDataURL();
    tilemapCache.set(id, url);
  }

  return (
    <div
      style={{
        width: width,
        height: (h / w) * width,
        backgroundImage: `url(${url})`,
        backgroundSize: "100% 100%",
      }}
    />
  );
}
