import "./Dialog.less";

import React from "react";
import { Grid, Paper } from "@mui/material";

interface DialogProps {
  open: boolean;
  children: React.ReactNode;
}

export function Dialog({ open, children }: DialogProps) {
  return (
    <div className={"dialog-backdrop " + (open ? "dialog-open" : "")}>
      <div className="dialog-margin">
        <Grid container alignItems="center" justifyContent="center">
          <Paper className="dialog-body">{children}</Paper>
        </Grid>
      </div>
    </div>
  );
}
