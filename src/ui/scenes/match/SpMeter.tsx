import { Box, Typography } from "@mui/material";
import { ReactComponent } from "../../../engine/ReactComponent";
import { ColorPalette } from "../../ColorPalette";

interface SpMeterProps {
  player: IPlayerId;
  name: string;
  count: number;
  flip: boolean;
  preview: number;
}

export class SpMeter extends ReactComponent<SpMeterProps> {
  init(): SpMeterProps {
    return {
      player: 0,
      name: "Player",
      count: 0,
      flip: false,
      preview: -1,
    };
  }

  render() {
    const img = `/textures/player${this.props.player + 1}_special_space.webp`;
    const wi = 32;
    const pi = 5;
    return (
      <Box sx={{ pointerEvents: "none" }}>
        <Box
          className="sz-meter-gutter"
          sx={{
            position: "absolute",
            width: 16,
            height: 92,
            backgroundColor: [ColorPalette.Player1, ColorPalette.Player2][
              this.props.player
            ].primary.hexSharp,
          }}
        ></Box>
        <Box
          className="sz-meter-player-name"
          sx={{
            position: "absolute",
            top: -16,
            ...(!this.props.flip
              ? { left: 32, textAlign: "left" }
              : { right: 16, textAlign: "right" }),
            width: 1e5,
            overflow: "visible",
            fontFamily: "Splatoon1",
            fontSize: "1.2rem",
            color: "white",
            textShadow: "4px 4px black",
          }}
        >
          {this.props.name}
        </Box>
        <Box className="sz-meter-bg-spaces">
          {[0.7, 0.6, 0.4, 0.2].map((alpha, i) => (
            <Box
              key={i}
              sx={{
                position: "absolute",
                top: 56,
                left: !this.props.flip
                  ? 32 + i * (wi + pi)
                  : -(48 - pi + i * (wi + pi)),
                width: wi,
                height: wi,
                background: "black",
                opacity: alpha,
              }}
            ></Box>
          ))}
        </Box>
        <Box className="sz-meter-fg-spaces">
          {Array(16)
            .fill(0)
            .map((_, i) => (
              <Box
                key={i}
                sx={{
                  position: "absolute",
                  top: 56,
                  left: !this.props.flip
                    ? 32 + i * (wi + pi)
                    : -(48 - pi + i * (wi + pi)),
                  width: wi,
                  height: wi,
                  background: `url(${img})`,
                  backgroundSize: "100% 100%",
                  opacity:
                    i >= this.props.count
                      ? 0
                      : this.props.preview >= 0 && i >= this.props.preview
                      ? 0.2
                      : 1,
                  transition: "opacity 150ms ease-out",
                }}
              ></Box>
            ))}
        </Box>
      </Box>
    );
  }
}
