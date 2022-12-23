import * as React from "react";
import { Button } from "@mui/material";
import { Color } from "../engine/Color";
import { Typography } from "@mui/material";
import { TableturfPlayerInfo } from "../Game";

interface PlayerBarProps {
  disabled: boolean;
  color: Color;
  playerInfo: TableturfPlayerInfo;
  onClick: () => void;
}

export function PlayerBar(props: PlayerBarProps) {
  const { disabled, color, playerInfo, onClick } = props;
  const playerBar = (
    <Button
      disabled={disabled}
      onClick={onClick}
      sx={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(
          to bottom, 
          #${color.hex}ee, 
          #${color.darken(0.3).hex}ee
        )`,
        borderRadius: 9999,
        textAlign: "left",
        fontSize: 64,
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
  return <React.Fragment>{playerInfo ? playerBar : baseBar}</React.Fragment>;
}
