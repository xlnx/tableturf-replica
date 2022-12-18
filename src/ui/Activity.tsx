import "./Activity.less";

import React from "react";
import { Box, Button, Card, Paper, CardHeader, Divider } from "@mui/material";
import { ReactComponent } from "../engine/ReactComponent";

interface ActivityProps {
  zIndex: number;
  title?: string;
  parent?: () => Activity;
}

export abstract class Activity<Props extends {} = {}> extends ReactComponent<
  Props & ActivityProps
> {
  async back() {
    return true;
  }

  show() {
    ActivityPanel.toggle(this);
  }
}

interface ActivityBodyProps {
  activity: Activity;
}

function ActivityBody({ activity }: ActivityBodyProps) {
  return (
    <Card
      sx={{
        boxSizing: "border-box",
        position: "absolute",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 0,
        p: 2,
      }}
    >
      <CardHeader
        title={activity.props.title}
        subheader={
          !activity.props.parent ? null : (
            <Box
              sx={{
                display: "inline",
                cursor: "pointer",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              <span
                onClick={() =>
                  activity
                    .back()
                    .then((ok) => ok && activity.props.parent().show())
                }
              >{`< ${activity.props.parent().props.title}`}</span>
            </Box>
          )
        }
      ></CardHeader>
      <Divider></Divider>
      <Box sx={{ flexGrow: 1, pt: 2 }}>
        <Box
          className="activity-content-root"
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
          }}
        >
          {activity.node}
        </Box>
      </Box>
    </Card>
  );
}

interface TransitionProps {
  src: Activity;
  dst: Activity;
  dt: number;
}

function Transition({ src, dst, dt }: TransitionProps) {
  const frontIn = dst.props.zIndex > src.props.zIndex;
  return (
    <>
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          zIndex: dst.props.zIndex,
          animationName: frontIn ? "front-activity-in" : "back-activity-in",
          animationDuration: `${dt}ms`,
          animationTimingFunction: frontIn
            ? "ease-out"
            : "cubic-bezier(0.16, 1, 0.3, 1)",
          animationFillMode: "forwards",
        }}
      >
        <ActivityBody activity={dst} />
      </div>
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          zIndex: src.props.zIndex,
          animationName: frontIn ? "back-activity-out" : "front-activity-out",
          animationDuration: `${dt}ms`,
          animationTimingFunction: frontIn
            ? "cubic-bezier(0.7, 0, 0.84, 0)"
            : "ease-in",
          animationFillMode: "forwards",
        }}
      >
        <ActivityBody activity={src} />
      </div>
    </>
  );
}

interface ActivityPanelProps {
  activity: Activity;
  view: React.ReactNode;
}

class ActivityPanel_0 extends ReactComponent<ActivityPanelProps> {
  init() {
    return {
      activity: null,
      view: null,
    };
  }

  render(): React.ReactNode {
    const w = 128;
    const wi = 32;
    const [state, setState] = React.useState({
      open: false,
    });
    return (
      <Box
        sx={{
          position: "absolute",
          left: state.open ? 0 : -600,
          width: 600,
          height: 1080,
          transition: `left ${200}ms cubic-bezier(0.65, 0, 0.35, 1)`,
        }}
      >
        <Paper
          style={{
            position: "absolute",
            left: "100%",
            top: 0,
            width: w,
            height: w,
            borderRadius: `0 ${wi}px ${wi}px 0`,
          }}
        >
          <Box
            sx={{
              boxSizing: "border-box",
              width: "100%",
              height: "100%",
              p: 2,
            }}
          >
            <div
              style={{
                backgroundImage: "url(/textures/Squid.webp)",
                backgroundSize: "100% 100%",
                width: "100%",
                height: "100%",
                cursor: "pointer",
              }}
              onClick={() => setState({ ...state, open: !state.open })}
            ></div>
          </Box>
        </Paper>
        {this.props.view}
      </Box>
    );
  }

  async toggle(activity: Activity) {
    if (this.props.activity == null) {
      await this.update({
        activity,
        view: <ActivityBody activity={activity} />,
      });
      return;
    }
    console.assert(activity.props.zIndex != this.props.activity.props.zIndex);
    await this.update({
      activity,
      view: (
        <Transition
          src={this.props.activity}
          dst={activity}
          dt={300}
        ></Transition>
      ),
    });
  }
}

export const ActivityPanel = new ActivityPanel_0();
