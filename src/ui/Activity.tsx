import "./Activity.less";

import React from "react";
import { Box, Card, Paper, CardHeader, Divider } from "@mui/material";
import { ReactComponent } from "../engine/ReactComponent";
import { v4 } from "uuid";
import { getLogger } from "loglevel";

const logger = getLogger("activity");
logger.setLevel("info");

interface ActivityProps {
  zIndex: number;
  title?: string;
  parent?: () => Activity;
}

export abstract class Activity<Props extends {} = {}> extends ReactComponent<
  Props & ActivityProps
> {
  public readonly id = v4();

  async back() {
    return true;
  }

  async show() {
    await ActivityPanel.toggle(this);
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

interface ActivityPanelProps {
  open: boolean;
  activities: Set<Activity>;
  current: Activity;
  previous: Activity;
}

class ActivityPanel_0 extends ReactComponent<ActivityPanelProps> {
  init() {
    return {
      open: false,
      activities: new Set<Activity>(),
      current: null,
      previous: null,
    };
  }

  async toggle(activity: Activity) {
    if (activity == this.props.current) {
      return;
    }
    const activities = new Set(this.props.activities);
    activities.add(activity);
    logger.log("toggle", activity.props.title, activities);
    await this.update({
      current: activity,
      previous: this.props.current,
      activities,
    });
  }

  render(): React.ReactNode {
    const w = 128;
    const wi = 32;
    const dt = 300;
    const activities = [];
    logger.log(this.props.current.props.title);
    logger.log(this.props.activities);
    this.props.activities.forEach((activity) => {
      let extra: any = {
        visibility: "hidden",
      };
      const isDst = this.props.current == activity;
      const isSrc = this.props.previous == activity;
      logger.log(isSrc, isDst, activity.props.title);
      if (!this.props.previous) {
        if (isDst) {
          extra = { visibility: "visible" };
        }
      } else {
        const frontIn =
          this.props.current.props.zIndex > this.props.previous.props.zIndex;
        if (isDst) {
          extra = {
            animationName: frontIn ? "front-activity-in" : "back-activity-in",
            animationDuration: `${dt}ms`,
            animationTimingFunction: frontIn
              ? "ease-out"
              : "cubic-bezier(0.16, 1, 0.3, 1)",
            animationFillMode: "forwards",
          };
        }
        if (isSrc) {
          extra = {
            animationName: frontIn ? "back-activity-out" : "front-activity-out",
            animationDuration: `${dt}ms`,
            animationTimingFunction: frontIn
              ? "cubic-bezier(0.7, 0, 0.84, 0)"
              : "ease-in",
            animationFillMode: "forwards",
          };
        }
      }
      activities.push(
        <div
          key={activity.id}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            zIndex: activity.props.zIndex,
            ...extra,
          }}
        >
          <ActivityBody activity={activity} />
        </div>
      );
    });
    return (
      <Box
        sx={{
          position: "absolute",
          left: this.props.open ? 0 : -600,
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
              onClick={() => this.update({ open: !this.props.open })}
            ></div>
          </Box>
        </Paper>
        {activities}
      </Box>
    );
  }
}

export const ActivityPanel = new ActivityPanel_0();
