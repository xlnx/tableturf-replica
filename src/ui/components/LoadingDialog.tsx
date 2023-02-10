import "./LoadingDialog.less";

import { ReactNode } from "react";
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

  render(): ReactNode {
    return (
      <Dialog open={this.props.open}>
        <Typography component={"span"} fontSize={"1.5rem"}>
          <div className="loading-circle-margin">
            <div className="loading-circle" />
          </div>
          {this.props.msg}
        </Typography>
      </Dialog>
    );
  }
}

export const LoadingDialog = new LoadingDialog_0();
