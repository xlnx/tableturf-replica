import React from "react";
import { Window } from "../engine/Window";
import { Box, Button, ThemeProvider } from "@mui/material";
import { Theme, BasicButton } from "./Theme";
import Paper from "@mui/material/Paper";
import { Activity, ActivityPanel } from "./Activity";

const MyActivity = new (class extends Activity {
  init() {
    return {
      level: 0,
    };
  }

  render(): React.ReactNode {
    return (
      <Button
        onClick={() => {
          MyActivity1.show();
        }}
      >
        fuck you
      </Button>
    );
  }
})();

const MyActivity1 = new (class extends Activity {
  init() {
    return {
      level: 1,
    };
  }

  render(): React.ReactNode {
    return (
      <Button
        onClick={() => {
          MyActivity.show();
        }}
      >
        fuck you again
      </Button>
    );
  }
})();

class TestWindow_0 extends Window {
  renderReact() {
    return (
      <ThemeProvider theme={Theme}>
        <Box
          sx={{
            position: "relative",
            width: 1920,
            height: 1080,
            overflow: "hidden",
            background: "#eeeeee",
          }}
        >
          <Paper
            sx={{
              boxSizing: "border-box",
              width: 600,
              height: 1080,
              borderRadius: 1,
              p: 2,
            }}
          >
            {ActivityPanel.node}
            {/* <Activity level={0}>
              <Button>fuck you</Button>
            </Activity> */}
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }
}

export const TestWindow = new TestWindow_0();
ActivityPanel.toggle(MyActivity);
