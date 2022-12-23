import { createTheme, PaperTypeMap } from "@mui/material";
import { Box, Paper, Grid, styled } from "@mui/material";
import ToggleButton, { ToggleButtonTypeMap } from "@mui/material/ToggleButton";

export const ResponsiveBox = styled(Box)(() => ({
  width: "max-content",
  height: "max-content",
}));

export function BasicButton<T extends ToggleButtonTypeMap["props"]>({
  children,
  sx,
  ...rest
}: Partial<T>) {
  return (
    <ToggleButton
      value=""
      sx={{
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
        ...sx,
      }}
      {...rest}
    >
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

type PaperProps_0 = PaperTypeMap["props"];
interface MyDialogProps extends PaperProps_0 {
  open: boolean;
  onClose: () => void;
}

export function MyDialog({ children, open, sx, onClose }: MyDialogProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
        visibility: open ? "visible" : "hidden",
        opacity: open ? 1 : 0,
        backgroundColor: "#0000007f",
        pointerEvents: "all",
        transition: "all 0.2s ease-in-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        <Grid container alignItems="center" justifyContent="center">
          <div onClick={(evt) => evt.stopPropagation()}>
            <Paper
              sx={{
                height: "max-content",
                borderRadius: 2,
                p: 2,
                ...sx,
              }}
            >
              {children}
            </Paper>
          </div>
        </Grid>
      </div>
    </div>
  );
}

// const aeroBoxStyle = {
//   backgroundColor: "rgba(0, 0, 0, 0.65)",
//   backdropFilter: "blur(8px)",
//   boxShadow: "5px 5px 10px 5px rgba(0, 0, 0, 0.4)",
// };

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
    // MuiButton: {
    //   styleOverrides: {
    //     contained: {
    //       backgroundColor: "#ffffffcc",
    //     },
    //   },
    // },
    MuiPaper: {
      styleOverrides: {
        root: {
          pointerEvents: "all",
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          boxShadow: "5px 5px 10px 5px rgba(0, 0, 0, 0.4)",
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          pointerEvents: "all",
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
  },
});
