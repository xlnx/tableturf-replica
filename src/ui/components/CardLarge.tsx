import { useMemo } from "react";
import { getLogger } from "loglevel";
import { Spaces, getCardById } from "../../core/Tableturf";
import { I18n } from "../../i18n/I18n";
import { Card } from "./Card";
import { SquareTilemap } from "./SquareTilemap";
import { v4 } from "uuid";

const logger = getLogger("card-large");
logger.setLevel("info");

interface CardLargeProps {
  card: number;
  width: number;
  player?: IPlayerId;
  active?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const layout = {
  width: 344,
  height: 480,
  radius: 25,
};

function SvgImage({ ...props }) {
  return <image preserveAspectRatio="none" {...props} />;
}

const style = {
  Common: {
    cardBg: "/textures/MngCardBG_Cmn_00.webp",
    InnerFrameBg: ({ ...props }) => <rect fill="#070707" {...props} />,
    costImg: "/textures/CardCost_00.webp",
    NameBg: ({ ...props }) => <feFlood floodColor="#8577ff" {...props} />,
  },
  Rare: {
    cardBg: "/textures/MngCardBG_Rre_00.webp",
    InnerFrameBg: ({ ...props }) => (
      <SvgImage xlinkHref="/textures/GrdFresh_01.webp" {...props} />
    ),
    costImg: "/textures/CardCost_01.webp",
    NameBg: ({ ...props }) => (
      <feImage
        preserveAspectRatio="none"
        xlinkHref="/textures/GrdFresh_01.webp"
        {...props}
      />
    ),
  },
  Fresh: {
    cardBg: "/textures/MngCardBG_Frh_00.webp",
    InnerFrameBg: ({ ...props }) => (
      <SvgImage xlinkHref="/textures/GrdFresh_00.webp" {...props} />
    ),
    costImg: "/textures/CardCost_02.webp",
    NameBg: ({ ...props }) => (
      <feImage
        preserveAspectRatio="none"
        xlinkHref="/textures/GrdFresh_00.webp"
        {...props}
      />
    ),
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
  active = true,
  selected = false,
  onClick = () => {},
}: CardLargeProps) {
  const node = useMemo(() => {
    logger.log(`card-large re-render`);
    const card = getCardById(cardId);
    const { cardBg, InnerFrameBg, costImg, NameBg } = style[card.rarity];
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
    const id = v4();
    return (
      <svg width={layout.width} height={layout.height}>
        <defs>
          <mask id={`inner-frame-mask-${id}`}>
            <rect x={7} y={9} width={330} height={462} fill="white"></rect>
            <rect
              x={17}
              y={18}
              width={310}
              height={446}
              rx={14}
              fill="black"
            ></rect>
          </mask>
          <filter id={`name-filter-${id}`}>
            <NameBg
              x={-100}
              y={0}
              width={layout.width * 2}
              height={layout.height}
              result="bg"
            />
            <feComposite
              in="SourceGraphic"
              in2="bg"
              operator="arithmetic"
              k1="1"
              k2="0"
              k3="0"
              k4="0"
            />
          </filter>
        </defs>
        <>
          <SvgImage
            className="card-large-card-bg"
            x={7}
            y={9}
            width={330}
            height={462}
            xlinkHref={cardBg}
          />
          <SvgImage
            className="card-large-ink"
            width={layout.width}
            height={layout.height}
            xlinkHref="/textures/Ink_03.webp"
            style={{ filter: "brightness(84.7%)" }}
          />
          <SvgImage
            className="card-large-footer"
            x={10}
            y={389}
            width={324}
            height={86}
            xlinkHref="/textures/CardFrame_01.webp"
            style={{ opacity: 0.9 }}
          />
          <InnerFrameBg
            className="card-large-inner-frame"
            width={layout.width}
            height={layout.height}
            mask={`url(#inner-frame-mask-${id})`}
          />
          <SvgImage
            className="card-large-frame"
            width={layout.width}
            height={layout.height}
            xlinkHref="/textures/CardFrame_00.webp"
          />
          <SvgImage
            className="card-large-bg"
            width={layout.width}
            height={layout.height}
            xlinkHref={`/textures/${card.render.bg}`}
          />
          <SvgImage
            className="card-large-sz-count-base"
            x={16}
            y={400}
            width={64}
            height={64}
            xlinkHref={costImg}
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              transform: "rotate(45deg)",
            }}
          />
          <text
            className="card-large-sz-count"
            x={48}
            y={442}
            textAnchor="middle"
            fontSize={32}
            fontFamily="Splatoon1"
            fill="#efefef"
            stroke="black"
            strokeWidth={6}
            paintOrder="stroke"
          >
            {card.count.area}
          </text>
          <g
            className="card-large-sp-meter"
            style={{ transform: "translate(94px, 422px)" }}
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
          </g>
          <g
            width={122}
            height={122}
            className="card-large-grid"
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              transform: "translate(200px, 332px) rotate(7deg)",
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
          </g>
        </>
        <text
          className="card-large-name"
          x={"50%"}
          y={85}
          textAnchor="middle"
          fontSize={40}
          fontFamily="Splatoon1"
          fill="white"
          stroke="black"
          strokeWidth={8}
          paintOrder="stroke"
          filter={`url(#name-filter-${id})`}
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
            transform: `scaleX(${cardNameScaleX * 100}%)`,
          }}
        >
          {cardName}
        </text>
      </svg>
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
