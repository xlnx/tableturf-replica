import React from "react";
import { getCardById } from "../../core/Tableturf";
import { PulseAnimation } from "../../engine/animations/PulseAnimation";
import { CardGrid } from "./CardGrid";

import "./CardSmall.less";
import { Card } from "./Card";

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
  const [state, setState] = React.useState({
    bodyScale: 1,
    clickAnim: new PulseAnimation({
      from: 1,
      to: 1.04,
      time: 0.15,
      update: (v) => setState({ ...state, bodyScale: v }),
    }),
  });
  const card = getCardById(cardId);
  const spMeter = [];
  for (let i = 0; i < card.count.special; ++i) {
    const w = 13;
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
          src={`textures/pure_orange.webp`}
          style={{
            position: "absolute",
            width: w,
            height: w,
          }}
        ></img>
      </div>
    );
  }
  const w = 153;
  const h = 196;
  const p = 9;
  return (
    <Card
      width={width}
      layout={{ width: w, height: h, radius: 7 }}
      active={active}
      selected={selected}
      onClick={onClick}
    >
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
      <CardGrid
        rect={card}
        width={w - 2 * p}
        style={{
          position: "absolute",
          left: p,
          top: p,
          transform: "scale(1, 0.934)",
          transformOrigin: "top left",
        }}
      ></CardGrid>
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
      <div
        style={{
          position: "relative",
          left: 63,
          top: 155,
        }}
      >
        {spMeter}
      </div>
    </Card>
  );
}
