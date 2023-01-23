import { Spaces } from "../../core/Tableturf";
import { SquareTilemap } from "./SquareTilemap";

interface CardGridProps {
  card: ICard;
  player: IPlayerId;
  width: number;
}

export function CardGrid({ card, player, width }: CardGridProps) {
  return (
    <SquareTilemap
      id={`card-grid-${card.id}-${player}`}
      rect={card}
      values={[
        {
          image: "/textures/empty_space.webp",
          alpha: 0.7,
          value: Spaces.EMPTY,
        },
        {
          image: `/textures/player${player + 1}_trivial_space.webp`,
          value: Spaces.TRIVIAL,
        },
        {
          image: `/textures/player${player + 1}_special_space.webp`,
          value: Spaces.SPECIAL,
        },
      ]}
      width={width}
      layout={{ width: 40 }}
    />
  );
}
