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

const layout = {
  width: 153,
  height: 196,
  radius: 7,
  padding: 9,
};

export function CardSmall({
  card: cardId,
  width,
  active = true,
  selected = false,
  onClick = () => {},
}: CardSmallProps) {
  const node = useMemo(() => {
    logger.log(`card-small re-render`);
    const card = getCardById(cardId);
    return (
      <div style={{ width: layout.width, height: layout.height }}>
        <img
          className="card-small-bg"
          src={`/textures/${card.render.bg}`}
          style={{
            position: "absolute",
            left: 0,
            top: layout.padding,
            width: "100%",
            height: "100%",
          }}
        />
        <div
          className="card-small-overlay"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            background: "#3f4044",
            opacity: 0.8,
          }}
        />
        <div
          className="card-small-grid"
          style={{
            position: "absolute",
            left: layout.padding,
            top: layout.padding,
            transform: "scale(1, 0.934)",
            transformOrigin: "top left",
          }}
        >
          <SquareTilemap
            id={`card-grid-small-${card.id}`}
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
            width={layout.width - 2 * layout.padding}
            layout={{ width: 40 }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 6,
            top: layout.height - 6 - 44,
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
        <div
          style={{
            position: "absolute",
            left: 58,
            top: 152,
          }}
        >
          <SquareTilemap
            id={`card-small-sp-${card.count.special}`}
            rect={{
              size: [5, 2],
              values: Array(card.count.special).fill(0),
            }}
            values={[{ image: "/textures/pure_orange.webp", value: 0 }]}
            width={64}
            layout={{
              width: 40,
              padding: { x: 8, y: 8 },
            }}
          />
        </div>
      </div>
    );
  }, [cardId, width]);

  return (
    <Card
      width={width}
      layout={layout}
      active={active}
      selected={selected}
      onClick={onClick}
    >
      {node}
    </Card>
  );
}
