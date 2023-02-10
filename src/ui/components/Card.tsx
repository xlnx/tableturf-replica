import "./Card.less";

import { ReactNode, useMemo, useRef } from "react";
import { getLogger } from "loglevel";
import { EaseFunc } from "../../engine/animations/Ease";
import gsap from "gsap";

const logger = getLogger("card");
logger.setLevel("info");

interface CardProps {
  // layout: { width: number; height: number; radius: number };
  // width: number;
  children?: ReactNode;
  active?: boolean;
  selected?: boolean;
  onClick?: () => void;
  //
  className?: string;
}

export function Card({
  // layout,
  // width,
  children,
  active = true,
  selected = false,
  onClick,
  //
  className = "",
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
      <div className="card-body">
        <div className="card-body-inner" ref={bodyRef}>
          {children}
          <div className="card-overlay" />
        </div>
      </div>
    );
  }, [children]);

  return (
    <div
      className={
        "card " +
        (!active
          ? "card-inactive"
          : selected
          ? "card-selected"
          : "card-active") +
        " " +
        className
      }
      onClick={handleClick}
    >
      {body}
    </div>
  );
}
