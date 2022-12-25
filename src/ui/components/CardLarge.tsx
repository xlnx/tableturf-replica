import { getCardById } from "../../core/Tableturf";
import { I18n } from "../../i18n/I18n";
import { Card } from "./Card";
import { CardGrid } from "./CardGrid";

interface CardLargeProps {
  card: number;
  width: number;
  active?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function CardLarge({
  card: cardId,
  width,
  active = true,
  selected = false,
  onClick = () => {},
}: CardLargeProps) {
  const card = getCardById(cardId);
  const spMeter = [];
  for (let i = 0; i < card.count.special; ++i) {
    const w = 16;
    const p = 2;
    spMeter.push(
      // TODO: replace this with animatable fire grid
      <div
        key={`${i}`}
        style={{
          position: "relative",
          left: i * (w + p),
        }}
      >
        <img
          src={`textures/player1_special_space.webp`}
          style={{
            position: "absolute",
            width: w,
            height: w,
          }}
        ></img>
      </div>
    );
  }
  const l0 = { Common: "Cmn", Rare: "Rre", Fresh: "Frh" }[card.rarity];
  const l1 = ["Common", "Rare", "Fresh"].indexOf(card.rarity);
  const w = 344;
  const h = 480;
  return (
    <Card
      width={width}
      layout={{ width: w, height: h, radius: 25 }}
      active={active}
      selected={selected}
      onClick={onClick}
    >
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
          width: w,
          height: h,
          filter: "brightness(84.7%)",
        }}
      />
      <img
        src={`/textures/${card.render.bg}`}
        style={{
          position: "absolute",
          width: w,
          height: h,
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
          width: w,
          height: h,
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
      {[{ WebkitTextStroke: "6px black" }, {}].map((style) => (
        <div
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
          left: 94,
          top: 436,
        }}
      >
        <div
          style={{
            position: "relative",
          }}
        >
          {spMeter}
        </div>
      </div>
      <CardGrid
        rect={card}
        width={122}
        style={{
          position: "absolute",
          left: 200,
          top: 332,
          transformOrigin: "center",
          transform: "rotate(7deg)",
        }}
      ></CardGrid>
      {[{ WebkitTextStroke: "8px black" }, {}].map((style) => (
        <div
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            left: w / 2,
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
    </Card>
  );
}
