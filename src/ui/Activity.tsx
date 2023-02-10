import "./Activity.less";

import { useMemo, ReactNode } from "react";
import { Box, Paper, CardHeader, Divider } from "@mui/material";
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
    <Paper
      style={{
        boxSizing: "border-box",
        position: "absolute",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 0,
        padding: 16,
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
      />
      <Divider />
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: 0,
          flexGrow: 1,
          paddingTop: 16,
        }}
      >
        {activity.node}
      </div>
    </Paper>
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

  async show(ok = true) {
    await this.update({ open: ok });
  }

  async hide() {
    await this.show(false);
  }

  render(): ReactNode {
    const dt = 300;

    const activities = [];
    // logger.log(this.props.current.props.title);
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
          extra = { visibility: "inherit" };
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

    const squid = useMemo(
      () => (
        <Paper className="activitiy-btn-squid">
          <div
            className="activitiy-btn-squid-img"
            onClick={() => this.update({ open: !this.props.open })}
          />
        </Paper>
      ),
      []
    );

    return (
      <div
        className={
          "activity " + (this.props.open ? "activity-open" : "activity-closed")
        }
      >
        {squid}
        {activities}
      </div>
    );
  }
}

export const ActivityPanel = new ActivityPanel_0();
