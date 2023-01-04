import "./Card.less";

import React from "react";
import { PulseAnimation } from "../../engine/animations/PulseAnimation";
import { getLogger } from "loglevel";

const logger = getLogger("card");
logger.setLevel("info");

interface CardProps {
  layout: { width: number; height: number; radius: number };
  width: number;
  radius?: number;
  children?: React.ReactNode;
  animation?: boolean;
  active?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function Card({
  layout,
  width,
  children,
  animation = true,
  active = true,
  selected = false,
  onClick = () => {},
}: CardProps) {
  logger.log(`card rerender`);

  selected = active && selected;
  const [state, setState] = React.useState({
    bodyScale: 1,
  });

  const clickAnim = React.useMemo(
    () =>
      new PulseAnimation({
        from: 1,
        to: 1.04,
        time: 0.15,
        update: (v) => setState({ ...state, bodyScale: v }),
      }),
    []
  );

  const handleClick = () => {
    if (!active) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    clickAnim.send();
    onClick();
  };

  const className = ["card"];
  if (animation) {
    className.push(active ? "card-active" : "card-inactive");
    if (selected) {
      className.push("card-selected");
    }
  }
  return (
    <div
      className={className.join(" ")}
      style={{
        width,
        height: (layout.height / layout.width) * width,
      }}
      onClick={handleClick}
    >
      <div
        className="card-body"
        style={{
          width: "100%",
          height: "100%",
          scale: `${state.bodyScale}`,
          transformOrigin: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "relative",
            width: layout.width,
            height: layout.height,
            borderRadius: layout.radius,
            background: "#9ea28c",
            overflow: "hidden",
            transform: `scale(${width / layout.width})`,
            transformOrigin: "top left",
            boxShadow: selected
              ? "4px 4px rgba(0, 0, 0, 0.5)"
              : "2px 2px rgba(0, 0, 0, 0.2)",
          }}
        >
          <div
            className="card-content"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
            }}
          >
            {children}
          </div>
          <div
            className="card-overlay"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
