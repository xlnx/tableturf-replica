import { useMemo } from "react";
import { getLogger } from "loglevel";
import { Spaces, getCardById } from "../../core/Tableturf";
import { I18n } from "../../i18n/I18n";
import { Card } from "./Card";
import { SquareTilemap } from "./SquareTilemap";

const logger = getLogger("card-large");
logger.setLevel("info");

interface CardLargeProps {
  card: number;
  width: number;
  player?: IPlayerId;
  animation?: boolean;
  active?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const layout = {
  width: 344,
  height: 480,
  radius: 25,
};

export function CardLarge({
  card: cardId,
  width,
  player = 0,
  animation = true,
  active = true,
  selected = false,
  onClick = () => {},
}: CardLargeProps) {
  const node = useMemo(() => {
    logger.log(`card-large re-render`);
    const card = getCardById(cardId);
    const l0 = { Common: "Cmn", Rare: "Rre", Fresh: "Frh" }[card.rarity];
    const l1 = ["Common", "Rare", "Fresh"].indexOf(card.rarity);
    return (
      <div style={{ width: layout.width, height: layout.height }}>
        <img
          src={`/textures/MngCardBG_${l0}_00.webp`}
          style={{
            position: "absolute",
            left: 7,
            top: 9,
            width: 330,
            height: 462,
          }}
        />
        <img
          src={`/textures/Ink_03.webp`}
          style={{
            position: "absolute",
            width: layout.width,
            height: layout.height,
            filter: "brightness(84.7%)",
          }}
        />
        <img
          src={`/textures/${card.render.bg}`}
          style={{
            position: "absolute",
            width: layout.width,
            height: layout.height,
          }}
        />
        <img
          src={`/textures/CardFrame_01.webp`}
          style={{
            position: "absolute",
            width: 324,
            height: 86,
            left: 10,
            top: 389,
          }}
        />
        <img
          src={`/textures/CardFrame_00.webp`}
          style={{
            position: "absolute",
            width: layout.width,
            height: layout.height,
          }}
        />
        <img
          src={`/textures/CardCost_0${l1}.webp`}
          style={{
            position: "absolute",
            width: 64,
            height: 64,
            left: 16,
            top: 400,
            transform: "rotate(45deg) ",
          }}
        />
        {[{ WebkitTextStroke: "6px black" }, {}].map((style, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 0,
              height: 0,
              left: 50,
              top: 405,
            }}
          >
            <span
              style={{
                ...style,
                display: "flex",
                justifyContent: "center",
                color: "white",
                fontFamily: "Splatoon1",
                fontSize: 28,
                whiteSpace: "nowrap",
              }}
            >
              {card.count.area}
            </span>
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 432,
          }}
        >
          <SquareTilemap
            id={`card-large-sp-${card.count.special}-${player}`}
            rect={{
              size: [5, 2],
              values: Array(card.count.special).fill(0),
            }}
            values={[
              {
                image: `/textures/player${player + 1}_special_space.webp`,
                value: 0,
              },
            ]}
            width={160 / 2}
            layout={{
              width: 40,
              padding: { x: 9, y: 9 },
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 200,
            top: 332,
            transformOrigin: "center",
            transform: "rotate(7deg)",
          }}
        >
          <SquareTilemap
            id={`card-grid-large-${card.id}-${player}`}
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
            width={122}
            layout={{ width: 40 }}
          />
        </div>
        {[{ WebkitTextStroke: "8px black" }, {}].map((style, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 0,
              height: 0,
              left: layout.width / 2,
              top: 36,
            }}
          >
            <span
              style={{
                ...style,
                display: "flex",
                justifyContent: "center",
                color: "white",
                fontFamily: "Splatoon1",
                fontSize: 32,
                whiteSpace: "nowrap",
              }}
            >
              {I18n.localize("CommonMsg/MiniGame/MiniGameCardName", card.name)}
            </span>
          </div>
        ))}
      </div>
    );
  }, [cardId, width]);

  return (
    <Card
      width={width}
      layout={layout}
      animation={animation}
      active={active}
      selected={selected}
      onClick={onClick}
    >
      {node}
    </Card>
  );
}
