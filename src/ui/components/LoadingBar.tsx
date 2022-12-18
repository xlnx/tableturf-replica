import "./LoadingBar.less";

import React from "react";
import { Grid, Paper, Typography } from "@mui/material";
import { ReactComponent } from "../../engine/ReactComponent";

interface LoadingScreenProps {
  msg: string;
  open: boolean;
}

interface WaitOptions {
  message: string;
}

class LoadingBar_0 extends ReactComponent<LoadingScreenProps> {
  init() {
    return {
      msg: "",
      open: false,
    };
  }

  async wait(task: Promise<any>, opts: WaitOptions) {
    await this.update({ msg: opts.message, open: true });
    try {
      await task;
    } finally {
      await this.update({ open: false });
    }
  }

  render(): React.ReactNode {
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          zIndex: 1e6,
          visibility: this.props.open ? "visible" : "hidden",
          opacity: this.props.open ? 1 : 0,
          backgroundColor: "#0000009f",
          pointerEvents: "all",
          transition: `all ${200}ms ease-in-out`,
        }}
      >
        <div
          style={{
            position: "relative",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <Grid container alignItems="center" justifyContent="center">
            <Paper sx={{ width: "max-content", p: 4 }}>
              <Typography component={"span"} fontSize={"1.5rem"}>
                <div
                  style={{
                    boxSizing: "content-box",
                    display: "inline-flex",
                    padding: "0.5rem",
                  }}
                >
                  <div
                    className="loading-circle"
                    style={{
                      width: "1.5rem",
                      height: "1.5rem",
                    }}
                  ></div>
                </div>
                {this.props.msg}
              </Typography>
            </Paper>
          </Grid>
        </div>
      </div>
    );
  }
}

export const LoadingBar = new LoadingBar_0();
