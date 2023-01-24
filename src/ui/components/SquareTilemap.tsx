import { getValue } from "../../core/Tableturf";
import { getLogger } from "loglevel";
import { System } from "../../engine/System";

const logger = getLogger("tilemap");
logger.setLevel("info");

function loadImage(url: string) {
  const texture = System.texture(url.split("textures/")[1]);
  const resource = texture.baseTexture.resource as any;
  return resource.source;
}

const canvas = document.createElement("canvas");
const tilemapCache = new Map<string, string>();

interface SquareTilemapProps {
  id: string;
  rect: IRect;
  values: {
    value: number;
    image: string;
    alpha?: number;
  }[];
  width: number;
  layout: {
    width: number;
    padding?: {
      x: number;
      y: number;
    };
  };
}

export function SquareTilemap({
  id,
  rect,
  values,
  width,
  layout: { width: wi, padding: { x: px, y: py } = { x: 0, y: 0 } },
}: SquareTilemapProps) {
  const [w, h] = rect.size;
  const dx = wi + px;
  const dy = wi + py;

  let url = tilemapCache.get(id);
  if (!url) {
    logger.log(`tilemap render: ${id}`);
    const imgs = values.map(({ image }) => loadImage(image));
    const styles = new Map<
      number,
      { image: HTMLImageElement; alpha: number }
    >();
    values.forEach(({ value, alpha = 1 }, i) => {
      styles.set(value, { image: imgs[i], alpha });
    });
    canvas.width = w * dx;
    canvas.height = h * dy;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        const style = styles.get(getValue(rect, { x, y }));
        if (!style) {
          continue;
        }
        const { image, alpha } = style;
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
