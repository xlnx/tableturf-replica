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

const style = {
  Common: {
    cardBg: "/textures/MngCardBG_Cmn_00.webp",
    innerFrameBg: "linear-gradient(#070707 0 0)",
    costImg: "/textures/CardCost_00.webp",
    nameBg: "linear-gradient(#8577ff 0 0)",
  },
  Rare: {
    cardBg: "/textures/MngCardBG_Rre_00.webp",
    innerFrameBg: "url(/textures/GrdFresh_01.webp)",
    costImg: "/textures/CardCost_01.webp",
    nameBg: "url(/textures/GrdFresh_01.webp)",
  },
  Fresh: {
    cardBg: "/textures/MngCardBG_Frh_00.webp",
    innerFrameBg: "url(/textures/GrdFresh_00.webp)",
    costImg: "/textures/CardCost_02.webp",
    nameBg: "url(/textures/GrdFresh_00.webp)",
  },
};

const canvas = document.createElement("canvas");

function getTextWidth(text: string, font: string) {
  const ctx = canvas.getContext("2d");
  ctx.font = font;
  const metrics = ctx.measureText(text);
  return metrics.width;
}

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
    const { cardBg, innerFrameBg, costImg, nameBg } = style[card.rarity];
    const spMeter = Array(10);
    for (let i = 0; i < card.count.special - 5; ++i) {
      spMeter[i] = 0;
    }
    for (let i = 0; i < Math.min(card.count.special, 5); ++i) {
      spMeter[i + 5] = 0;
    }
    const cardName = I18n.localize(
      "CommonMsg/MiniGame/MiniGameCardName",
      card.name
    );
    const cardNameScaleX = Math.min(
      1,
      layout.width / getTextWidth(cardName, "40pt Splatoon1")
    );
    return (
      <div style={{ width: layout.width, height: layout.height }}>
        <img
          className="card-large-card-bg"
          src={cardBg}
          style={{
            position: "absolute",
            left: 7,
            top: 9,
            width: 330,
            height: 462,
          }}
        />
        <img
          className="card-large-ink"
          src={`/textures/Ink_03.webp`}
          style={{
            position: "absolute",
            width: layout.width,
            height: layout.height,
            filter: "brightness(84.7%)",
          }}
        />
        <img
          className="card-large-footer"
          src={`/textures/CardFrame_01.webp`}
          style={{
            position: "absolute",
            width: 324,
            height: 86,
            left: 10,
            top: 389,
            opacity: 0.9,
          }}
        />
        <img
          className="card-large-frame"
          src={`/textures/CardFrame_00.webp`}
          style={{
            position: "absolute",
            width: layout.width,
            height: layout.height,
          }}
        />
        <div
          className="card-large-inner-frame"
          style={{
            position: "absolute",
            left: 10,
            top: 11,
            width: 324,
            height: 460,
            padding: 4,
            borderRadius: 16,
            boxSizing: "border-box",
            // backgroundClip: "border-box",
            backgroundImage: innerFrameBg,
            backgroundSize: "100% 100%",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
          }}
        />
        <img
          className="card-large-bg"
          src={`/textures/${card.render.bg}`}
          style={{
            position: "absolute",
            width: layout.width,
            height: layout.height,
          }}
        />
        <img
          className="card-large-sz-count-base"
          src={costImg}
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
            className="card-large-sz-count"
            key={i}
            style={{
              position: "absolute",
              width: 0,
              height: 0,
              left: 50,
              top: 398,
              display: "flex",
              justifyContent: "center",
              whiteSpace: "nowrap",
              color: "#efefef",
              fontFamily: "Splatoon1",
              fontSize: 32,
            }}
          >
            <span style={{ ...style }}>{card.count.area}</span>
          </div>
        ))}
        <div
          className="card-large-sp-meter"
          style={{
            position: "absolute",
            left: 94,
            top: 424,
          }}
        >
          <SquareTilemap
            id={`card-large-sp-${card.count.special}-${player}`}
            rect={{
              size: [5, 2],
              values: spMeter,
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
              padding: { x: 8, y: 8 },
            }}
          />
        </div>
        <div
          className="card-large-grid"
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
            className="card-large-name"
            key={i}
            style={{
              position: "absolute",
              width: `${100 / cardNameScaleX}%`,
              height: "100%",
              left: "50%",
              transform: `translateX(-50%) scaleX(${cardNameScaleX * 100}%)`,
              transformOrigin: "center",
              display: "flex",
              justifyContent: "center",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              backgroundImage: nameBg,
              backgroundSize: "100% 100%",
              whiteSpace: "nowrap",
              color: "transparent",
              fontFamily: "Splatoon1",
              fontSize: 40,
            }}
          >
            <span style={{ ...style, paddingTop: 32 }}>{cardName}</span>
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
