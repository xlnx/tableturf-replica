import "./CardLarge.less";

import { useMemo } from "react";
import { getLogger } from "loglevel";
import { Spaces, getCardById } from "../../core/Tableturf";
import { I18n } from "../../i18n/I18n";
import { Card } from "./Card";
import { SquareTilemap } from "./SquareTilemap";
import { v4 } from "uuid";
import { measureTextWidth } from "../../engine/Utils";
import { Platform } from "../../engine/Platform";

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

const svgStyle = {
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
        xlinkHref="/textures/GrdFreshText_01.webp"
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
        xlinkHref="/textures/GrdFreshText_00.webp"
        {...props}
      />
    ),
  },
};

function renderSvg(card: ICard, player: IPlayerId) {
  const { cardBg, InnerFrameBg, costImg, NameBg } = svgStyle[card.rarity];
  const spMeter = Array(10);
  for (let i = 0; i < card.count.special - 5; ++i) {
    spMeter[i] = Spaces.SPECIAL;
  }
  for (let i = 0; i < Math.min(card.count.special, 5); ++i) {
    spMeter[i + 5] = Spaces.SPECIAL;
  }
  const cardName = I18n.localize(
    "CommonMsg/MiniGame/MiniGameCardName",
    card.name
  );
  const cardNameScaleX = Math.min(
    1,
    layout.width / measureTextWidth(cardName, "40pt Splatoon1")
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
            player={player}
            rect={{
              size: [5, 2],
              values: spMeter,
            }}
            width={160 / 2}
            padding={0.3}
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
            id={`card-grid-${card.id}-${player}`}
            rect={card}
            player={player}
            width={122}
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
}

const webkitStyle = {
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
    nameBg: "url(/textures/GrdFreshText_01.webp)",
  },
  Fresh: {
    cardBg: "/textures/MngCardBG_Frh_00.webp",
    innerFrameBg: "url(/textures/GrdFresh_00.webp)",
    costImg: "/textures/CardCost_02.webp",
    nameBg: "url(/textures/GrdFreshText_00.webp)",
  },
};

function renderWebKit(card: ICard, player: IPlayerId) {
  const { cardBg, innerFrameBg, costImg, nameBg } = webkitStyle[card.rarity];
  const spMeter = Array(10);
  for (let i = 0; i < card.count.special - 5; ++i) {
    spMeter[i] = Spaces.SPECIAL;
  }
  for (let i = 0; i < Math.min(card.count.special, 5); ++i) {
    spMeter[i + 5] = Spaces.SPECIAL;
  }
  const cardName = I18n.localize(
    "CommonMsg/MiniGame/MiniGameCardName",
    card.name
  );
  const cardNameScaleX = Math.min(
    1,
    layout.width / measureTextWidth(cardName, "40pt Splatoon1")
  );
  return (
    <>
      <img className="card-large-card-bg" src={cardBg} />
      <img className="card-large-ink" src={`/textures/Ink_03.webp`} />
      <img className="card-large-footer" src={`/textures/CardFrame_01.webp`} />
      <img className="card-large-frame" src={`/textures/CardFrame_00.webp`} />
      <div
        className="card-large-inner-frame"
        style={{ backgroundImage: innerFrameBg }}
      />
      <img className="card-large-bg" src={`/textures/${card.render.bg}`} />
      <img className="card-large-sz-count-base" src={costImg} />
      {[0, 1].map((i) => (
        <div className="card-large-sz-count" key={i}>
          <span className={`card-large-sz-count-text-${i}`}>
            {card.count.area}
          </span>
        </div>
      ))}
      <div className="card-large-sp-meter">
        <SquareTilemap
          id={`card-large-sp-${card.count.special}-${player}`}
          player={player}
          rect={{
            size: [5, 2],
            values: spMeter,
          }}
          width={160 / 2}
          padding={0.3}
        />
      </div>
      <div className="card-large-grid">
        <SquareTilemap
          id={`card-grid-${card.id}-${player}`}
          rect={card}
          player={player}
          width={122}
        />
      </div>
      {[0, 1].map((i) => (
        <div
          className="card-large-name"
          key={i}
          style={{
            width: `${80 / cardNameScaleX}%`,
            transform: `translateX(-50%) scaleX(${cardNameScaleX * 100}%)`,
            backgroundImage: nameBg,
          }}
        >
          <span className={`card-large-name-text-${i}`}>{cardName}</span>
        </div>
      ))}
    </>
  );
}

export function CardLarge({
  card: cardId,
  width,
  player = 0,
  active = true,
  selected = false,
  onClick,
}: CardLargeProps) {
  onClick = onClick || (() => {});

  const node = useMemo(() => {
    logger.log(`card-large re-render`);
    const card = getCardById(cardId);
    /**
     * webkit browser supports -webkit-mask & -webkit-text-stroke, which are really helpful
     * however firefox(Gecko) doesn't support webkit extensions, so we have to switch to
     * svg implementation. HOWEVER, when blink draws svg <text> with transform properties,
     * some ghosty glitches occurs from time to time:
     * https://bugs.chromium.org/p/chromium/issues/detail?id=1270713
     * the chromium team claimed that they have solved the issue, but not as i'v observed.
     * besides all these, chrome also performs badly when rendering my svg, at least far
     * slower than the dom version. the final solution is using ua dependant implementation.
     */
    if (Platform.isWebKit) {
      return renderWebKit(card, player);
    } else {
      return renderSvg(card, player);
    }
  }, [cardId, width, player]);

  return (
    <Card
      // width={width}
      // layout={layout}
      className="card-large"
      active={active}
      selected={selected}
      onClick={onClick}
    >
      {node}
    </Card>
  );
}
