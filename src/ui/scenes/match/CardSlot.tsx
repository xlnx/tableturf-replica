import "./CardSlot.less";

import { CardLarge } from "../../components/CardLarge";
import { CSSTransition } from "react-transition-group";
import { useRef } from "react";
import { Typography } from "@mui/material";

interface CardLargeSlotProps {
  width: number;
  dy?: number;
  card?: number;
  discard?: boolean;
  player?: IPlayerId;
  preview?: boolean;
  show?: boolean;
  flip?: boolean;
}

const layout = {
  width: 344,
  height: 480,
  radius: 25,
};

export function CardSlot({
  width,
  dy = 0,
  card = -1,
  discard = false,
  player = 0,
  preview = false,
  show = false,
  flip = true,
}: CardLargeSlotProps) {
  const bodyRef = useRef(null);
  dy = (dy * layout.width) / width;
  return (
    <div
      className={`card-slot ${preview ? "card-slot-preview" : ""}`}
      style={{
        width,
        height: (layout.height / layout.width) * width,
      }}
    >
      <div
        style={{
          transform: `scale(${width / layout.width})`,
          transformOrigin: "top left",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: layout.width,
            height: layout.height,
            borderRadius: layout.radius,
            border: "3px solid #888",
            boxSizing: "border-box",
            backgroundColor: "rgba(0,0,0,0.7)",
            transform: `translateY(${dy}px)`,
          }}
        >
          <img
            src="/textures/IconUp_00.webp"
            className="card-slot-circle"
            style={{
              position: "absolute",
              left: layout.width / 2 - 36,
              top: layout.height / 2 - 36,
              filter: "brightness(0.25)",
            }}
          />
        </div>
        <CSSTransition
          nodeRef={bodyRef}
          in={show}
          timeout={400}
          classNames="card-slot-body"
        >
          <div
            ref={bodyRef}
            className="card-slot-body"
            style={{
              position: "relative",
              width: layout.width,
              height: layout.height,
              perspective: 1600,
              visibility: show ? "inherit" : "hidden",
            }}
          >
            <div
              className="card-slot-body-spinner"
              style={{
                position: "relative",
                width: layout.width,
                height: layout.height,
                transform: `${
                  flip ? "" : "rotateY(180deg)"
                } translateY(${dy}px)`,
                transformStyle: "preserve-3d",
                transformOrigin: "center",
              }}
            >
              <div
                className="card-slot-body-front"
                style={{
                  position: "absolute",
                  backfaceVisibility: "hidden",
                }}
              >
                {card <= 0 ? null : (
                  <div style={{ position: "absolute" }}>
                    <CardLarge
                      width={layout.width}
                      card={card}
                      player={player}
                      animation={false}
                    />
                  </div>
                )}
                <div
                  className="card-slot-body-overlay"
                  style={{
                    position: "absolute",
                    width: layout.width,
                    height: layout.height,
                    borderRadius: 25,
                    backgroundColor: "rgba(95,95,95,0.6)",
                    opacity: discard ? 1 : 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography style={{ color: "white", fontSize: 60 }}>
                    Pass
                  </Typography>
                </div>
              </div>
              <img
                className="card-slot-body-back"
                src="/textures/MngCardSleeve_Default.webp"
                width={layout.width}
                height={layout.height}
                style={{
                  position: "absolute",
                  borderRadius: layout.radius,
                  transform: "rotateY(180deg)",
                  backfaceVisibility: "hidden",
                }}
              />
            </div>
          </div>
        </CSSTransition>
      </div>
    </div>
  );
}
