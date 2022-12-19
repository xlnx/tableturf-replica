import "./LoadingDialog.less";

import React from "react";
import { Typography } from "@mui/material";
import { ReactComponent } from "../../engine/ReactComponent";
import { Dialog } from "./Dialog";

interface LoadingDialogProps {
  open: boolean;
  msg: string;
}

interface WaitOptions<T> {
  task: Promise<T>;
  message: string;
}

class LoadingDialog_0 extends ReactComponent<LoadingDialogProps> {
  init() {
    return {
      msg: "",
      open: false,
    };
  }

  async wait<T>({ task, message }: WaitOptions<T>) {
    await this.update({ open: true, msg: message });
    try {
      return await task;
    } finally {
      await this.update({ open: false });
    }
  }

  render(): React.ReactNode {
    return (
      <Dialog open={this.props.open}>
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
      </Dialog>
    );
  }
}

export const LoadingDialog = new LoadingDialog_0();
