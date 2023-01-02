import { useEffect, useMemo, useRef, useState } from "react";
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

interface SquareTilemapProps {
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

const canvas = document.createElement("canvas");

export function SquareTilemap<Props extends SquareTilemapProps>({
  rect,
  values,
  width,
  layout: { width: wi, padding: { x: px, y: py } = { x: 0, y: 0 } },
  ...rest
}: Props) {
  const [state, setState] = useState({
    url: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
  });

  const [w, h] = rect.size;
  const dx = wi + px;
  const dy = wi + py;
  useEffect(() => {
    logger.log("tilemap re-render");
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    Promise.all(values.map(({ image }) => loadImage(image))).then((imgs) => {
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
      setState({ ...state, url: canvas.toDataURL() });
    });
  }, [rect, values]);

  return (
    <div {...rest}>
      <div style={{ width, height: (h / w) * width }}>
        <div
          style={{
            position: "relative",
            transform: `scale(${width / (wi * w)})`,
            transformOrigin: "top left",
          }}
        >
          <img src={state.url} width={w * dx} height={h * dy} />
        </div>
      </div>
    </div>
  );
}
