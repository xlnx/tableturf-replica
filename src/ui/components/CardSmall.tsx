import { useMemo } from "react";
import { getLogger } from "loglevel";
import { Spaces, getCardById } from "../../core/Tableturf";
import { SquareTilemap } from "./SquareTilemap";
import { Card } from "./Card";

const logger = getLogger("card-small");
logger.setLevel("info");

interface CardSmallProps {
  card: number;
  width: number;
  active?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function CardSmall({
  card: cardId,
  width,
  active = true,
  selected = false,
  onClick = () => {},
}: CardSmallProps) {
  const w = 153;
  const h = 196;
  const p = 9;
  const node = useMemo(() => {
    logger.log(`card-small re-render`);
    const card = getCardById(cardId);
    return (
      <div style={{ width: w, height: h }}>
        <img
          src={`textures/${card.render.bg}`}
          style={{
            position: "absolute",
            left: 0,
            top: p,
            width: "100%",
            height: "100%",
            filter: "brightness(0.7)",
          }}
        ></img>
        <SquareTilemap
          rect={card}
          values={[
            {
              image: "/textures/empty_space.webp",
              alpha: 0.7,
              value: Spaces.EMPTY,
            },
            { image: "/textures/pure_yellow.webp", value: Spaces.TRIVIAL },
            { image: "/textures/pure_orange.webp", value: Spaces.SPECIAL },
          ]}
          width={w - 2 * p}
          layout={{ width: 40 }}
          style={{
            position: "absolute",
            left: p,
            top: p,
            transform: "scale(1, 0.934)",
            transformOrigin: "top left",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 6,
            top: h - 6 - 44,
            width: 48,
            height: 44,
            borderRadius: 11,
            backgroundColor: "black",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              color: "white",
              fontFamily: "Splatoon1",
            }}
          >
            {card.count.area}
          </span>
        </div>
        <SquareTilemap
          rect={{
            size: [5, 2],
            values: Array(card.count.special).fill(0),
          }}
          values={[{ image: "/textures/pure_orange.webp", value: 0 }]}
          width={145 / 2}
          layout={{
            width: 40,
            padding: { x: 8, y: 8 },
          }}
          style={{
            position: "absolute",
            left: 60,
            top: 152,
          }}
        />
      </div>
    );
  }, [cardId, width]);

  return (
    <Card
      width={width}
      layout={{ width: w, height: h, radius: 7 }}
      active={active}
      selected={selected}
      onClick={onClick}
    >
      {node}
    </Card>
  );
}
