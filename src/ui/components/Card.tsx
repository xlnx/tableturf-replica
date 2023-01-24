import "./Card.less";

import { ReactNode, useMemo, useRef } from "react";
import { getLogger } from "loglevel";
import { EaseFunc } from "../../engine/animations/Ease";
import gsap from "gsap";

const logger = getLogger("card");
logger.setLevel("info");

interface CardProps {
  layout: { width: number; height: number; radius: number };
  width: number;
  children?: ReactNode;
  active?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function Card({
  layout,
  width,
  children,
  active = true,
  selected = false,
  onClick,
}: CardProps) {
  onClick = onClick || (() => {});

  const bodyRef = useRef(null);

  const handleClick = () => {
    if (!active) {
      return;
    }
    const anim = async () => {
      const body = bodyRef.current;
      await gsap.to(body, {
        duration: 0.075,
        scale: 1.04,
        ease: (v) => EaseFunc.EASE_OUT_CUBIC.apply(v),
      });
      await gsap.to(body, {
        duration: 0.075,
        scale: 1,
        ease: (v) => EaseFunc.EASE_IN_CUBIC.apply(v),
      });
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    anim();
    onClick();
  };

  const body = useMemo(() => {
    logger.log(`card rerender`);
    return (
      <div
        className="card-body"
        ref={bodyRef}
        style={{
          width: "100%",
          height: "100%",
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
            boxShadow:
              active && selected
                ? "4px 4px rgba(0, 0, 0, 0.5)"
                : "2px 2px rgba(0, 0, 0, 0.2)",
          }}
        >
          {children}
          <div
            className="card-overlay"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
            }}
          ></div>
        </div>
      </div>
    );
  }, [children, layout]);

  return (
    <div
      className={
        !active ? "card-inactive" : selected ? "card-selected" : "card-active"
      }
      style={{
        width,
        height: (layout.height / layout.width) * width,
        userSelect: "none",
      }}
      onClick={handleClick}
    >
      {body}
    </div>
  );
}
