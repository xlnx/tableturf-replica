import "./LoadingScreen.less";

import React from "react";
import { Box } from "@mui/material";
import { ReactComponent } from "../../engine/ReactComponent";

interface LoadingScreenProps {
  open: boolean;
}

class LoadingScreen_0 extends ReactComponent<LoadingScreenProps> {
  init() {
    return {
      open: false,
    };
  }

  async wait(task: Promise<any>) {
    await this.update({ open: true });
    try {
      await task;
    } finally {
      await this.update({ open: false });
    }
  }

  render(): React.ReactNode {
    const w = 128;
    return (
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          zIndex: 1e6,
          visibility: this.props.open ? "visible" : "hidden",
          opacity: this.props.open ? 1 : 0,
          backgroundColor: "#0000007f",
          pointerEvents: "all",
          transition: `all ${200}ms ease-in-out`,
        }}
      >
        <Box
          sx={{
            position: "relative",
            left: "50%",
            top: "50%",
          }}
        >
          <Box
            className="loading-circle"
            sx={{
              position: "absolute",
              left: -w / 2,
              top: -w / 2,
              width: w,
              height: w,
            }}
          ></Box>
        </Box>
      </Box>
    );
  }
}

export const LoadingScreen = new LoadingScreen_0();
