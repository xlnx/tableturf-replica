import React from "react";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import { v4 } from "uuid";
import { ReactComponent } from "../engine/ReactComponent";
import { Box, List, Paper, Typography } from "@mui/material";
import { ResponsiveBox } from "./Theme";
import { CSSTransition, TransitionGroup } from "react-transition-group";

import "./MessageBar.less";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

type MessageLevel = "error" | "warning" | "info" | "success";

interface Message {
  id: string;
  text: string;
  level: MessageLevel;
}

function MessageBarImpl<T extends { msg: Message }>({ msg }: T) {
  return (
    <ResponsiveBox sx={{ right: 0, marginLeft: "auto", marginRight: 0 }}>
      <Paper
        sx={(theme) => ({
          "&.MuiPaper-root": {
            backgroundColor: theme.palette[msg.level].main,
          },
        })}
      >
        <Typography sx={{ p: 2, userSelect: "none" }}>{msg.text}</Typography>
      </Paper>
    </ResponsiveBox>
  );
}

interface MessageBarProps {
  messages: Message[];
}

class MessageBar_0 extends ReactComponent<MessageBarProps> {
  init(): MessageBarProps {
    return {
      messages: [],
    };
  }

  render(): React.ReactNode {
    // const handleClose = () => this.update({ open: false });
    return (
      <Box
        sx={{
          position: "absolute",
          right: -1890,
          top: 0,
        }}
      >
        <List>
          <TransitionGroup>
            {this.props.messages.map((msg) => (
              <CSSTransition timeout={1000} classNames="msg-bar" key={msg.id}>
                <Box sx={{ p: 1 }}>
                  <MessageBarImpl msg={msg}></MessageBarImpl>
                </Box>
              </CSSTransition>
            ))}
          </TransitionGroup>
        </List>
        {/* <AnimatedList
          animation="slide"
          animationProps={{
            direction: "left",
            in: true,
          }}
        >
          {this.state.messages.map(({ id, text, level }) => (
            <MessageBarImpl key={id} message={text}></MessageBarImpl>
          ))}
        </AnimatedList> */}
        {/* <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={this.state.open}
        // autoHideDuration={6000}
        onClose={handleClose}
      >
        <Alert
          onClose={handleClose}
          severity={this.state.level}
          sx={{ width: "100%" }}
        >
          {this.state.message}
        </Alert>
      </Snackbar> */}
      </Box>
    );
  }

  prompt(level: MessageLevel, text: string) {
    const id = v4();
    this.update({
      messages: [{ text, level, id }, ...this.props.messages],
    });
    setTimeout(() => {
      const { messages } = this.props;
      const idx = this.props.messages.findIndex((msg) => msg.id == id);
      if (idx < 0) {
        return;
      }
      messages.splice(idx, 1);
      this.update({ messages });
    }, 6000);
  }

  error(error: string | Error) {
    if (error instanceof Error) {
      error = error.toString();
    }
    console.assert(typeof error == "string");
    this.prompt("error", error);
  }

  warning(error: string | Error) {
    if (error instanceof Error) {
      error = error.toString();
    }
    console.assert(typeof error == "string");
    this.prompt("warning", error);
  }

  info(message: string) {
    this.prompt("info", message);
  }

  success(message: string) {
    this.prompt("success", message);
  }
}

export const MessageBar = new MessageBar_0();
