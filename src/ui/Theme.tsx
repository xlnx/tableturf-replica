import "./Theme.less";

import { ReactNode, useRef, useState } from "react";
import {
  Box,
  createTheme,
  Grid,
  Typography,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuList,
  MenuItem,
  ToggleButtonGroup,
} from "@mui/material";
import ToggleButton, { ToggleButtonTypeMap } from "@mui/material/ToggleButton";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";

export function BasicButton<T extends ToggleButtonTypeMap["props"]>({
  children,
  sx,
  ...rest
}: Partial<T>) {
  return (
    <ToggleButton className="basic-btn" value="" sx={{ ...sx }} {...rest}>
      {children}
    </ToggleButton>
  );
}

export const TransparentButton = BasicButton;

export function DarkButton<T extends ToggleButtonTypeMap["props"]>({
  children,
  sx,
  ...rest
}: Partial<T>) {
  return (
    <ToggleButton
      className="basic-btn dark-btn"
      value=""
      sx={{ ...sx }}
      {...rest}
    >
      {children}
    </ToggleButton>
  );
}

interface SplitButtonProps {
  items: {
    text: string;
    onClick: () => void;
  }[];
  defaultItem: number;
  children: string;
  sx?: any;
}

export function SplitButton({
  children,
  items,
  defaultItem,
  sx,
}: SplitButtonProps) {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <ToggleButtonGroup ref={anchorRef} sx={{ ...sx }}>
        <BasicButton onClick={items[defaultItem].onClick}>
          {children}
        </BasicButton>
        <BasicButton
          onClick={() => setOpen((open) => !open)}
          sx={{ width: 50 }}
        >
          <ArrowDropDownIcon />
        </BasicButton>
      </ToggleButtonGroup>
      <Popper
        sx={{ zIndex: 1 }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <MenuList autoFocusItem>
                  {items.map(({ text, onClick }, i) => (
                    <MenuItem
                      key={i}
                      onClick={() => {
                        onClick();
                        setOpen(false);
                      }}
                      sx={{ fontSize: "0.8rem" }}
                    >
                      {text}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  );
}

interface CollapsibleProps {
  children: ReactNode;
  label: string;
  open: boolean;
  maxBodyHeight: number;
  onClick?: () => void;
}

export function Collapsible({
  children,
  label,
  open,
  maxBodyHeight,
  onClick,
}: CollapsibleProps) {
  onClick = onClick || (() => {});

  const color = open ? "text.primary" : "text.secondary";
  const dt = 150;
  return (
    <Grid
      className="collapsible"
      container
      spacing={2}
      // flexDirection="row"
      sx={{ width: "100%" }}
    >
      <Grid item xs={1}>
        <Box
          sx={{
            width: 16,
            height: "100%",
            backgroundColor: color,
            transition: `background-color ${dt}ms ease-out`,
          }}
        ></Box>
      </Grid>
      <Grid container item xs={11} spacing={2}>
        <Grid item xs={12}>
          <Typography
            sx={{
              fontSize: "0.8rem",
              color,
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
              transition: `color ${dt}ms ease-out`,
            }}
            onClick={onClick}
          >
            {label}
            {open ? (
              <ArrowDropUpIcon sx={{ fontSize: "1rem" }} />
            ) : (
              <ArrowDropDownIcon sx={{ fontSize: "1rem" }} />
            )}
          </Typography>
        </Grid>
        <Grid
          item
          xs={12}
          sx={{
            overflow: "hidden",
            maxHeight: open ? maxBodyHeight : 0,
            pointerEvents: open ? "inherit" : "none",
            transition: `all ${dt}ms ease-out`,
          }}
        >
          {children}
        </Grid>
      </Grid>
    </Grid>
  );
}

const theme = createTheme({});

export const Theme = createTheme({
  typography: {
    fontFamily: ["Splatoon2"].join(",") + "," + theme.typography.fontFamily,
    button: {
      textTransform: "none",
      // textShadow: "1px 1px black",
    },
  },
  palette: {
    mode: "dark",
    primary: {
      main: "#eeeeee",
    },
    secondary: {
      main: "#7f7f7f",
    },
    warning: {
      main: "#f57f17a5",
    },
    success: {
      main: "#1b5e20a5",
    },
    info: {
      main: "#000000a5",
    },
    error: {
      main: "#bf360ca5",
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "0.5rem",
          userSelect: "none",
          pointerEvents: "none",
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          background: "transparent",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        iconSizeMedium: {
          "& > *:first-of-type": {
            fontSize: "1rem",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(0, 0, 0, 0.92)",
          boxShadow: "5px 5px 10px 5px rgba(0, 0, 0, 0.4)",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          // this thing don't work with transform: scale(...)
          visibility: "hidden",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "0.6rem",
        },
      },
    },
  },
});
