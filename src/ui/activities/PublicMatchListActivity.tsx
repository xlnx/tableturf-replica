import { useEffect, useState } from "react";
import { Grid, Box, CardHeader, Button } from "@mui/material";
import { Activity } from "../Activity";
import { RootActivity } from "./RootActivity";
import { BasicButton } from "../Theme";
import { MatchActivity } from "./MatchActivity";
import { Gateway } from "../Gateway";
import { LobbyAPI } from "boardgame.io";
import { MessageBar } from "../components/MessageBar";

interface PublicMatchListActivityProps {
  matches: LobbyAPI.Match[];
  prevQueryDate: Date;
}

class PublicMatchListActivity_0 extends Activity<PublicMatchListActivityProps> {
  init() {
    return {
      zIndex: 1,
      title: "Public Match List",
      parent: () => RootActivity,

      matches: [],
      prevQueryDate: new Date(null),
    };
  }

  async listMatches() {
    const threshold = 2000;
    const allowUpdate =
      new Date().getTime() - this.props.prevQueryDate.getTime() > threshold;
    if (!allowUpdate) {
      return false;
    }
    try {
      const { matches } = await Gateway.listMatches();
      await this.update({
        matches,
        prevQueryDate: new Date(),
      });
      MessageBar.success("public match list updated");
    } catch (err) {
      MessageBar.error(err);
    }
    return true;
  }

  async show() {
    super.show();
    this.listMatches();
  }

  render() {
    return (
      <div>
        <Grid container spacing={2} sx={{ p: 2, flexGrow: 1 }}>
          {this.props.matches.map(({ matchID, setupData: { matchName } }) => (
            <Grid item xs={12} key={matchID}>
              <Button
                fullWidth
                onClick={() => MatchActivity.joinMatch(matchID)}
              >
                <CardHeader title={matchName} subheader={matchID} />
              </Button>
            </Grid>
          ))}
        </Grid>
        <Box
          sx={{
            boxSizing: "border-box",
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            p: 2,
          }}
        >
          <Grid container spacing={4} justifyContent={"flex-end"}>
            <Grid item xs={6}>
              <BasicButton
                fullWidth
                onClick={async () => {
                  const ok = await this.listMatches();
                  if (!ok) {
                    MessageBar.error("slow down and try again later");
                  }
                }}
              >
                Refresh
              </BasicButton>
            </Grid>
          </Grid>
        </Box>
      </div>
    );
  }
}

export const PublicMatchListActivity = new PublicMatchListActivity_0();
