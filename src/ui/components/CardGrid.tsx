import { getValue, Spaces } from "../../core/Tableturf";

interface CardGridProps {
  rect: IRect;
  width: number;
}

export function CardGrid<Props extends CardGridProps>({
  rect,
  width,
  ...rest
}: Props) {
  const [w, h] = rect.size;
  const li = [];
  const mi: any = [
    ["textures/empty_space.webp", 0.7],
    ["textures/pure_yellow.webp", 1],
    ["textures/pure_orange.webp", 1],
  ];
  const wi = 10;
  for (let y = 0; y < h; ++y) {
    for (let x = 0; x < w; ++x) {
      const v = getValue(rect, { x, y });
      const [src, alpha] = mi[v];
      li.push(
        <img
          key={`${y}-${x}`}
          src={src}
          style={{
            position: "absolute",
            opacity: alpha,
            left: x * wi,
            top: y * wi,
            width: wi,
            height: wi,
          }}
        ></img>
      );
    }
  }
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
          {li}
        </div>
      </div>
    </div>
  );
}
