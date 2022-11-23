import React from "react";
import { Button, Box } from "@mui/material";
import { Color } from "../engine/Color";
import { Typography } from "@mui/material";
import { TableturfPlayerInfo } from "../Game";
import gsap from "gsap";

interface PlayerBarProps {
  disabled: boolean;
  color: Color;
  playerInfo: TableturfPlayerInfo & { time: string };
  onClick: () => void;
}

export function PlayerBar(props: PlayerBarProps) {
  const { disabled, color, playerInfo, onClick } = props;
  // const dt = "0.2s";
  const prevPlayer = React.useRef<TableturfPlayerInfo & { time: string }>(null);
  const bar = React.useRef();
  React.useEffect(() => {
    const prev = prevPlayer.current;
    const curr = playerInfo;
    // leave
    const timeline = gsap.timeline();
    if (
      (prev != null && curr == null) ||
      (prev && curr && prev.time != curr.time)
    ) {
      timeline.to(bar.current, {
        duration: 0.2,
        x: 100,
        opacity: 0,
      });
    }
    // enter
    if (
      (prev == null && curr != null) ||
      (prev && curr && prev.time != curr.time)
    ) {
      timeline.to(bar.current, {
        duration: 0.2,
        x: 0,
        opacity: 1,
      });
    }
    // change
    prevPlayer.current = playerInfo;
  }, [playerInfo]);
  const playerBar = (
    <Button
      ref={bar}
      disabled={disabled}
      onClick={onClick}
      sx={{
        position: "absolute",
        left: 0,
        top: 0,
        // opacity: playerInfo ? 1 : 0,
        width: "100%",
        height: "100%",
        background: `linear-gradient(
          to bottom, 
          ${color.hexSharp}, 
          ${color.darken(0.3).hexSharp}
        )`,
        borderRadius: 9999,
        textAlign: "left",
        fontSize: 64,
        // transform: !playerInfo ? "translateX(20%)" : "translateX(0)",
        // transition: [`opacity ${dt}, transform ${dt}`],
      }}
    >
      <Typography
        sx={{
          color: "#eeeeee",
          textShadow: "1px 1px black",
        }}
      >
        {playerInfo ? playerInfo.name : ""}
      </Typography>
    </Button>
  );
  const baseBar = (
    <Button
      disabled={disabled}
      onClick={onClick}
      sx={{
        position: "absolute",
        left: 0,
        top: 0,
        transformOrigin: "center",
        transform: "scale(0.99)",
        width: "100%",
        height: "100%",
        border: "4px dashed #eeeeee",
        borderRadius: 9999,
        textAlign: "left",
      }}
    >
      <Typography>Connect</Typography>
    </Button>
  );
  return (
    <React.Fragment>
      <Box sx={{ height: 100, position: "relative" }}>
        {baseBar}
        {playerBar}
      </Box>
    </React.Fragment>
  );
}
