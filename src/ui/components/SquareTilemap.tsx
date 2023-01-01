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

export function SquareTilemap<Props extends SquareTilemapProps>({
  rect,
  values,
  width,
  layout: { width: wi, padding: { x: px, y: py } = { x: 0, y: 0 } },
  ...rest
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>();
  const [task, setTask] = useState(new Promise<void>((resolve) => resolve()));

  const [w, h] = rect.size;
  const dx = wi + px;
  const dy = wi + py;
  useEffect(() => {
    logger.log("tilemap re-render");
    const newTask = task.then(() =>
      Promise.all(values.map(({ image }) => loadImage(image))).then((imgs) => {
        const styles = new Map<
          number,
          { image: HTMLImageElement; alpha: number }
        >();
        values.forEach(({ value, alpha = 1 }, i) => {
          styles.set(value, { image: imgs[i], alpha });
        });
        const canvas = canvasRef.current;
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
      })
    );
    setTask(newTask);
  }, [rect, values]);

  const inner = useMemo(
    () => <canvas ref={canvasRef} width={w * dx} height={h * dy} />,
    [rect, values]
  );

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
          {inner}
        </div>
      </div>
    </div>
  );
}
