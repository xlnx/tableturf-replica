import { useState } from "react";
import { getValue } from "../../core/Tableturf";
import { getLogger } from "loglevel";

const logger = getLogger("tilemap");
logger.setLevel("info");

const imageCache = new Map<string, Promise<HTMLImageElement>>();

async function loadImage(url: string) {
  if (imageCache.has(url)) {
    return imageCache.get(url);
  }
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.src = url;
    image.onload = () => resolve(image);
    // TODO: handle errors
    // image.onerror = reject;
  });
  imageCache.set(url, promise);
  return promise;
}

const canvas = document.createElement("canvas");
const tilemapCache = new Map<string, string | Promise<string>>();

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
  const [version, setVersion] = useState(0);

  const [w, h] = rect.size;
  const dx = wi + px;
  const dy = wi + py;

  let item = tilemapCache.get(id);
  if (!item) {
    logger.log(`tilemap render: ${id}`);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    item = Promise.all(values.map(({ image }) => loadImage(image))).then(
      (imgs) => {
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
        return canvas.toDataURL();
      }
    );
    tilemapCache.set(id, item);
  }

  let url =
    "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
  if (item instanceof Promise) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    item.then((url) => {
      tilemapCache.set(id, url);
      setVersion(version + 1);
    });
  } else {
    url = item;
  }

  return (
    <div style={{ width, height: (h / w) * width }}>
      <div
        style={{
          position: "relative",
          transform: `scale(${width / (wi * w)})`,
          transformOrigin: "top left",
        }}
      >
        <img
          className={`tilemap-${id}`}
          src={url}
          width={w * dx}
          height={h * dy}
        />
      </div>
    </div>
  );
}
