import "./CardSmall.less";

import { useMemo } from "react";
import { getLogger } from "loglevel";
import { Spaces, getCardById } from "../../core/Tableturf";
import { SquareTilemap } from "./SquareTilemap";
import { Card } from "./Card";

const logger = getLogger("card-small");
logger.setLevel("info");

interface CardSmallProps {
  card: number;
  player?: IPlayerId;
  active?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function CardSmall({
  card: cardId,
  player = 0,
  active = true,
  selected = false,
  onClick,
}: CardSmallProps) {
  onClick = onClick || (() => {});

  const node = useMemo(() => {
    logger.log(`card-small re-render`);
    const card = getCardById(cardId);
    return (
      <>
        <img className="card-small-bg" src={`/textures/${card.render.bg}`} />
        <div className="card-small-overlay" />
        <div className="card-small-grid">
          <SquareTilemap
            id={`card-grid-${card.id}-${player}`}
            rect={card}
            player={player}
            width={153 - 2 * 9}
          />
        </div>
        <div className="card-small-sz-meter">
          <span>{card.count.area}</span>
        </div>
        <div className="card-small-sp-meter">
          <SquareTilemap
            id={`card-small-sp-${card.count.special}-${player}`}
            player={player}
            rect={{
              size: [5, 2],
              values: Array(card.count.special).fill(Spaces.SPECIAL),
            }}
            width={88}
            padding={0.3}
          />
        </div>
      </>
    );
  }, [cardId]);

  return (
    <Card
      className="card-small"
      active={active}
      selected={selected}
      onClick={onClick}
    >
      {node}
    </Card>
  );
}
