import "./Activity.less";

import { useMemo, ReactNode } from "react";
import { Paper, CardHeader, Divider } from "@mui/material";
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
    <Paper className="activity-body">
      <CardHeader
        title={activity.props.title}
        subheader={
          !activity.props.parent ? null : (
            <div className="activity-body-subheader">
              <span
                onClick={() =>
                  activity
                    .back()
                    .then((ok) => ok && activity.props.parent().show())
                }
              >{`< ${activity.props.parent().props.title}`}</span>
            </div>
          )
        }
      />
      <Divider />
      <div className="activity-body-content-margin">{activity.node}</div>
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
    const activities = [];
    // logger.log(this.props.current.props.title);
    logger.log(this.props.activities);
    this.props.activities.forEach((activity) => {
      const isDst = this.props.current == activity;
      const isSrc = this.props.previous == activity;
      logger.log(isSrc, isDst, activity.props.title);

      let tag = "hidden";
      if (!this.props.previous) {
        if (isDst) {
          tag = "visible";
        }
      } else {
        const frontIn =
          this.props.current.props.zIndex > this.props.previous.props.zIndex;
        if (isDst) {
          tag = frontIn ? "front-in" : "back-in";
        }
        if (isSrc) {
          tag = frontIn ? "back-out" : "front-out";
        }
      }

      activities.push(
        <div
          className={"activity-body-margin activity-body-anim-" + tag}
          key={activity.id}
          style={{ zIndex: activity.props.zIndex }}
        >
          <ActivityBody activity={activity} />
        </div>
      );
    });

    const squid = useMemo(
      () => (
        <Paper className="activity-btn-squid">
          <div
            className="activity-btn-squid-img"
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
