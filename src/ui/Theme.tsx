import { ReactNode } from "react";
import { Box, styled, createTheme, Grid, Typography } from "@mui/material";
import ToggleButton, { ToggleButtonTypeMap } from "@mui/material/ToggleButton";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";

export const ResponsiveBox = styled(Box)(() => ({
  width: "max-content",
  height: "max-content",
}));

const buttonStyles = {
  borderWidth: 3,
  backgroundColor: "#ffffff00",
  transition: "background-color 0.2s",
  textShadow: "2px 2px black",
  "&:hover :not(.Mui-selected)": {
    backgroundColor: "#ffffff11",
  },
  "&.Mui-selected": {
    backgroundColor: "#ffffff55",
  },
};

export function BasicButton<T extends ToggleButtonTypeMap["props"]>({
  children,
  sx,
  ...rest
}: Partial<T>) {
  return (
    <ToggleButton value="" sx={{ ...buttonStyles, ...sx }} {...rest}>
      {children}
    </ToggleButton>
  );
}

export const TransparentButton = BasicButton;
export const DarkButton = styled(BasicButton)(({ theme }) => ({
  backgroundColor: "#000000ee",
  "&:hover": {
    backgroundColor: "#2f2f2fee",
  },
}));

interface CollapsibleProps {
  children: ReactNode;
  open: boolean;
  maxBodyHeight: number;
  onClick?: () => void;
}

export function Collapsible({
  children,
  open,
  maxBodyHeight,
  onClick = () => {},
}: CollapsibleProps) {
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
            Bot Settings
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
