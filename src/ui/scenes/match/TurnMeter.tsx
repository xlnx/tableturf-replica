import { useRef } from "react";
import { Box, Paper } from "@mui/material";
import { ReactComponent } from "../../../engine/ReactComponent";
import { EaseFunc } from "../../../engine/animations/Ease";
import gsap from "gsap";

interface TurnMeterProps {
  count: number;
}

export class TurnMeter extends ReactComponent<TurnMeterProps> {
  private counterRef;

  init(): TurnMeterProps {
    return {
      count: 0,
    };
  }

  async uiUpdate(count: number) {
    const h = 20;
    const dt = 0.05;

    await gsap.to(this.counterRef.current, {
      duration: dt,
      y: -h,
      ease: (t) => EaseFunc.EASE_OUT_CUBIC.apply(t),
    });
    this.update({ count });
    await gsap.to(this.counterRef.current, {
      duration: dt,
      y: 0,
      ease: (t) => EaseFunc.EASE_IN_CUBIC.apply(t),
    });
  }

  render() {
    this.counterRef = useRef(null);
    return (
      <Paper
        sx={{
          position: "absolute",
          width: 180,
          height: 160,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          boxShadow: "2px 2px rgba(0, 0, 0, 0.4)",
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: 90,
            top: 8,
            display: "flex",
            overflow: "visible",
            width: 0,
            whiteSpace: "nowrap",
            justifyContent: "center",
            color: "#d0d0d0",
            fontFamily: "Splatoon1",
            textShadow: "2px 2px black",
            fontSize: 28,
          }}
        >
          Turns Left
        </Box>
        <Box
          ref={this.counterRef}
          sx={{
            position: "absolute",
            left: 90,
            top: 13,
            display: "flex",
            overflow: "visible",
            width: 0,
            whiteSpace: "nowrap",
            justifyContent: "center",
            color: this.props.count <= 3 ? "#f04833" : "white",
            fontFamily: "Splatoon1",
            textShadow: "8px 8px rgba(0 0 0 / 0.3)",
            fontSize: 76,
            transition: "color 100ms ease-out",
          }}
        >
          {this.props.count}
        </Box>
      </Paper>
    );
  }
}
