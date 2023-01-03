import React from "react";
import { Grid, Paper } from "@mui/material";

interface DialogProps {
  open: boolean;
  children: React.ReactNode;
}

export function Dialog({ open, children }: DialogProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
        zIndex: 1e6,
        visibility: open ? "inherit" : "hidden",
        opacity: open ? 1 : 0,
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
          <Paper sx={{ width: "max-content", p: 4 }}>{children}</Paper>
        </Grid>
      </div>
    </div>
  );
}
