import { useEffect, useState } from "react";
import { Grid, Box, CardHeader, Button } from "@mui/material";
import { Activity } from "../Activity";
import { RootActivity } from "./RootActivity";
import { BasicButton } from "../Theme";
import { LoadingDialog } from "../components/LoadingDialog";
import { OnlineViaInviteLinkActivity } from "./OnlineViaInviteLinkActivity";
import { MatchActivity } from "./MatchActivity";
import { Gateway } from "../Gateway";
import { DB } from "../../Database";
import { LobbyAPI } from "boardgame.io";
import { MessageBar } from "../components/MessageBar";

class OnlineLoungeActivity_0 extends Activity {
  init() {
    return {
      zIndex: 1,
      title: "Online Lounge",
      parent: () => RootActivity,
    };
  }

  render() {
    useEffect(() => {
      listMatches();
    }, []);

    const [state, setState] = useState({
      matches: [] as LobbyAPI.Match[],
      prevQueryDate: new Date(null),
    });

    const listMatches = async () => {
      const threshold = 1000;
      const allowUpdate =
        new Date().getTime() - state.prevQueryDate.getTime() > threshold;
      if (!allowUpdate) {
        return false;
      }
      try {
        const { matches } = await Gateway.listMatches();
        setState({
          ...state,
          matches,
          prevQueryDate: new Date(),
        });
        console.log("matches updated");
      } catch (err) {
        MessageBar.error(err);
      }
      return true;
    };

    const createMatch = async () => {
      try {
        const { playerName } = DB.read();
        const match = await LoadingDialog.wait({
          task: Gateway.createMatch({
            playerName,
            matchName: `${playerName}'s match`,
          }),
          message: "Creating Match...",
        });
        await MatchActivity.start(match);
      } catch (err) {
        MessageBar.error(err);
      }
    };

    const joinMatch = async (matchID: string) => {
      try {
        const match = await LoadingDialog.wait({
          task: Gateway.joinMatch(matchID, {
            playerName: DB.read().playerName,
          }),
          message: "Joining Match...",
        });
        await MatchActivity.start(match);
      } catch (err) {
        MessageBar.error(err);
      }
    };

    return (
      <>
        <Grid container spacing={4} sx={{ p: 2, flexGrow: 1 }}>
          {state.matches.map(({ matchID, setupData: { matchName } }) => (
            <Grid item xs={12} key={matchID}>
              <Button fullWidth onClick={() => joinMatch(matchID)}>
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
                onClick={() => OnlineViaInviteLinkActivity.show()}
              >
                Via Invite Link
              </BasicButton>
            </Grid>
            <Grid item xs={6}>
              <BasicButton fullWidth onClick={createMatch}>
                Create Match
              </BasicButton>
            </Grid>
          </Grid>
        </Box>
      </>
    );
  }
}

export const OnlineLoungeActivity = new OnlineLoungeActivity_0();
