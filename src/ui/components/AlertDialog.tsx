import React from "react";
import { CardHeader, Divider, Box, Grid } from "@mui/material";
import { ReactComponent } from "../../engine/ReactComponent";
import { Dialog } from "./Dialog";
import { BasicButton } from "../Theme";

interface AlertDialogProps {
  open: boolean;
  msg: string;
  okMsg: string;
  cancelMsg: string;
  onInput: (ok: boolean) => void;
}

interface PromptOptions {
  msg: string;
  okMsg?: string;
  cancelMsg?: string;
}

class AlertDialog_0 extends ReactComponent<AlertDialogProps> {
  init() {
    return {
      open: false,
      msg: "",
      okMsg: "",
      cancelMsg: "",
      onInput: () => {},
    };
  }

  async prompt({ msg, okMsg = "OK", cancelMsg = "Not now" }: PromptOptions) {
    let resolve;
    const promise = new Promise<boolean>((_) => (resolve = _));
    await this.update({
      open: true,
      msg,
      okMsg,
      cancelMsg,
      onInput: (ok) => resolve(ok),
    });
    try {
      return await promise;
    } finally {
      await this.update({ open: false });
    }
  }

  render(): React.ReactNode {
    const handleInput = async (ok: boolean) => {
      this.props.onInput(ok);
      await this.update({ open: false });
    };
    return (
      <Dialog open={this.props.open}>
        <CardHeader title={<>{this.props.msg}</>}></CardHeader>
        <Divider sx={{ pt: 2 }} />
        <Grid container spacing={2} justifyContent="flex-end" sx={{ pt: 4 }}>
          {!this.props.okMsg ? null : (
            <Grid item xs={6}>
              <BasicButton fullWidth onClick={() => handleInput(true)}>
                {this.props.okMsg}
              </BasicButton>
            </Grid>
          )}
          {!this.props.cancelMsg ? null : (
            <Grid item xs={6}>
              <BasicButton fullWidth onClick={() => handleInput(false)}>
                {this.props.cancelMsg}
              </BasicButton>
            </Grid>
          )}
        </Grid>
      </Dialog>
    );
  }
}

export const AlertDialog = new AlertDialog_0();
