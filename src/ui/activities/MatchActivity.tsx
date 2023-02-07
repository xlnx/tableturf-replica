import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Grid,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { Activity, ActivityPanel } from "../Activity";
import { RootActivity } from "./RootActivity";
import { BasicButton, Collapsible } from "../Theme";
import { getLogger } from "loglevel";
import { AlertDialog } from "../components/AlertDialog";
import { MessageBar } from "../components/MessageBar";
import { System } from "../../engine/System";
import { MatchWindow } from "../scenes/match/MatchWindow";
import { InkResetAnimation } from "../InkResetAnimation";
import { getStageById } from "../../core/Tableturf";
import { isDeckValid } from "../../Terms";
import { I18n } from "../../i18n/I18n";
import { DB } from "../../Database";
import { Match } from "../../game/Match";
import { ClientState } from "boardgame.io/dist/types/src/client/client";
import { StarterDeck } from "../../game/MatchController";
import { Color } from "../../engine/Color";
import StarIcon from "@mui/icons-material/Star";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { EntryWindow } from "../scenes/entry/EntryWindow";
import { Gateway } from "../Gateway";
import { LoadingDialog } from "../components/LoadingDialog";

const logger = getLogger("main-dialog");
logger.setLevel("info");

type Role = "spectator" | "alpha" | "bravo";
const styles = {
  spectator: {
    backgroundColor: "#3c4048",
  },
  alpha: {
    backgroundColor: "#dc5f00",
  },
  bravo: {
    backgroundColor: "#4649ff",
  },
};

function PlayerAvatar({ online, name, role, ready, host, self, onClick }) {
  const btn = !online ? null : (
    <Button
      sx={{
        width: "100%",
        height: "100%",
        fontSize: "1.5rem",
        backgroundColor: Color.fromHex(styles[role].backgroundColor).darken(0.2)
          .hexSharp,
        transition: "all 200ms ease-out",
        "&:hover": {
          backgroundColor: styles[role].backgroundColor,
        },
      }}
      onClick={onClick}
    >
      {!name || name.substring(0, 2).toUpperCase()}
    </Button>
  );
  const [w, h] = [108, 96];
  return (
    <Tooltip followCursor placement="top" title={name}>
      <Box sx={{ position: "relative", width: w, height: h }}>
        {btn}
        <StarIcon
          sx={{
            position: "absolute",
            left: 4,
            top: 4,
            color: "white",
            fontSize: "0.9rem",
            opacity: host ? 1 : 0,
            pointerEvents: "none",
            transition: "all 200ms ease-out",
          }}
        />
        {!self ? null : (
          <ArrowDropDownIcon
            sx={{
              position: "absolute",
              left: 5,
              top: -70,
              color: "white",
              fontSize: "3rem",
              pointerEvents: "none",
            }}
          />
        )}
        {!online || !ready ? null : (
          <Box
            sx={{
              position: "absolute",
              left: 60,
              top: 60,
              width: 50,
              height: 50,
              backgroundImage: "url(/textures/Check_00.webp)",
              backgroundSize: "100% 100%",
              pointerEvents: "none",
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
}

interface MatchActivityProps {
  match: Match;
  state: ClientState<IMatchState>;
  deck: IDeckData;
  manualExit: boolean;
}

const defaultDeck: IDeckData = {
  name: "Starter Deck",
  deck: StarterDeck.slice(),
};

class MatchActivity_0 extends Activity<MatchActivityProps> {
  init() {
    const { currDeck, decks } = DB.read();
    let deck = { ...decks[currDeck] };
    if (!isDeckValid(deck.deck)) {
      deck = defaultDeck;
    }
    return {
      zIndex: 10,
      title: "Match",
      parent: () => RootActivity,
      //
      match: null,
      state: null,
      deck,
      manualExit: false,
    };
  }

  async createMatch() {
    try {
      const { playerName } = DB.read();
      const matchName = `${playerName}'s match`;
      const task = async () => {
        const match = await Gateway.createMatch({
          playerName,
          matchName,
        });
        await this.start(match, matchName);
      };
      await LoadingDialog.wait({
        task: task(),
        message: "Creating Match...",
      });
    } catch (err) {
      MessageBar.error(err);
    }
  }

  async joinMatch(matchID: string) {
    try {
      const task = async () => {
        const {
          setupData: { matchName },
        } = await Gateway.getMatch(matchID);
        const match = await Gateway.joinMatch(matchID, {
          playerName: DB.read().playerName,
        });
        await this.start(match, matchName);
      };
      await LoadingDialog.wait({
        task: task(),
        message: "Joining Match...",
      });
    } catch (err) {
      MessageBar.error(err);
    }
  }

  private async start(match: Match, name: string) {
    console.assert(match.isConnected());

    MessageBar.success(`joined [${name}]`);

    match.on("update", (state, prevState) => {
      this.update({ state });

      if (
        state.ctx.phase == "handshake" &&
        prevState.ctx.phase != "handshake"
      ) {
        match.send("Handshake", { deck: this.props.deck.deck.slice() });
      }
    });

    match.on("player-join", (playerID) => {
      const { name } = match.client.matchData[playerID];
      MessageBar.success(`[${name}] joined the match`);
    });

    match.on("player-leave", (playerID) => {
      const { name } = match.client.matchData[playerID];
      MessageBar.warning(`[${name}] left the match`);
    });

    match.on("change-host", (playerID) => {
      const { name } = match.client.matchData[playerID];
      MessageBar.success(`[${name}] became host`);
    });

    match.on("disconnect", async (manual) => {
      if (!manual) {
        await AlertDialog.prompt({
          msg: "A communication error has occurred",
          cancelMsg: null,
        });
      }
      match.stop();
      if (MatchWindow.ui.visible) {
        await InkResetAnimation.play(async () => {
          this.send("cancel");
          await ActivityPanel.show();
          await this.props.parent().show();
          EntryWindow.show();
        });
      } else {
        await ActivityPanel.show();
        await this.props.parent().show();
      }
    });

    await this.update({
      title: name,
      match,
      state: match.client.getState(),
      manualExit: false,
    });

    await MatchWindow.bind(match);

    // give the browser 300ms to compute layout
    await new Promise((resolve) => setTimeout(resolve, 300));

    await this.show();
  }

  async back() {
    console.assert(this.props.match);
    const ok = await AlertDialog.prompt({
      msg: "Leave this match?",
    });
    if (ok) {
      await this.update({ manualExit: true });
      this.props.match.stop();
    }
    return ok;
  }

  render() {
    const [state, setState] = useState({
      settingsOpen: false,
      selectedPlayer: 0,
      playerMenuAnchorEl: null,
      version: 0,
    });

    useEffect(() => {
      DB.subscribe(() =>
        setState((state) => ({ ...state, version: state.version + 1 }))
      );
    }, []);

    const {
      match,
      state: { G, ctx },
    } = this.props;

    const isHost = G.meta.host == match.playerID;
    const isSpectator = G.meta.players.indexOf(match.playerID) < 0;
    const isReady = G.buffer.ready[match.playerID];
    const isPreparing = ctx.phase == "prepare";
    const isControlDisabled = !isPreparing || isReady;
    const isPlayersEnough = G.meta.players.length == 2;
    const isPlayersReady = G.meta.players.every(
      (i) => i == G.meta.host || G.buffer.ready[+i]
    );

    const mainPanel = useMemo(() => {
      const ttlMenuItems = [30, 60, 120, 300, 0].map((ttl) => (
        <MenuItem value={ttl} key={ttl}>
          {!ttl
            ? "Unlimited"
            : ttl < 60
            ? `${ttl} sec`
            : `${Math.round(ttl / 60)} min`}
        </MenuItem>
      ));

      // main street, thunder point, x marks the garden, square squared, lakefront property, double gemini, river drift, box seats
      const stageMenuItems = [3, 6, 7, 5, 2, 1, 4, 0]
        .map(getStageById)
        .map((stage) => (
          <MenuItem value={stage.id} key={stage.id}>
            {I18n.localize("CommonMsg/MiniGame/MiniGameMapName", stage.name)}
          </MenuItem>
        ));

      const decks = DB.read().decks.slice();
      const deckMenuItems = decks.map(({ name, deck }, i) => (
        <MenuItem value={i} key={i} disabled={!isDeckValid(deck)}>
          {name}
        </MenuItem>
      ));

      return (
        <>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              variant="standard"
              label="Turn Time Limit"
              disabled={isControlDisabled || !isHost}
              value={G.meta.turnTimeQuotaSec}
              onChange={({ target }) =>
                match.send("UpdateMeta", {
                  turnTimeQuotaSec: +target.value,
                })
              }
            >
              {ttlMenuItems}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Tooltip
              followCursor
              placement="top"
              title={!isHost ? "This operation is host-only" : "Select a stage"}
            >
              <TextField
                fullWidth
                select
                variant="standard"
                label="Stage"
                disabled={isControlDisabled || !isHost}
                value={G.meta.stage}
                onChange={({ target }) =>
                  match.send("UpdateMeta", { stage: +target.value })
                }
              >
                {stageMenuItems}
              </TextField>
            </Tooltip>
          </Grid>
          <Grid item xs={12}>
            <Tooltip followCursor placement="top" title={"Select your deck"}>
              <TextField
                fullWidth
                select
                variant="standard"
                label="Deck"
                disabled={isControlDisabled}
                value={-1}
                onChange={({ target }) =>
                  this.update({ deck: { ...decks[+target.value] } })
                }
              >
                <MenuItem value={-1} sx={{ display: "none" }}>
                  {this.props.deck.name + " [Snapshot]"}
                </MenuItem>
                {deckMenuItems}
              </TextField>
            </Tooltip>
          </Grid>
        </>
      );
    }, [
      // controller
      match,
      // values
      G.meta.turnTimeQuotaSec,
      G.meta.stage,
      this.props.deck,
      // validate control
      isHost,
      isControlDisabled,
      // force update
      state.version,
    ]);

    const settingsPanel = useMemo(() => {
      return (
        <Grid item xs={12} sx={{ p: 2 }}>
          <Collapsible
            label="Advanced Settings"
            open={state.settingsOpen}
            onClick={() =>
              setState((state) => ({
                ...state,
                settingsOpen: !state.settingsOpen,
              }))
            }
            maxBodyHeight={180}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Tooltip
                  followCursor
                  placement="top"
                  title={
                    !isHost
                      ? "This operation is host-only"
                      : "Decide how may times a player is allowed to redraw his hand"
                  }
                >
                  <TextField
                    fullWidth
                    variant="standard"
                    type="number"
                    label="Redraw Quota"
                    disabled={isControlDisabled || !isHost}
                    value={G.meta.redrawQuota}
                    onChange={({ target }) => {
                      const quota = +target.value;
                      if (0 <= quota && quota < 10) {
                        match.send("UpdateMeta", { redrawQuota: quota });
                      }
                    }}
                  />
                </Tooltip>
              </Grid>
            </Grid>
          </Collapsible>
        </Grid>
      );
    }, [
      // controller
      match,
      // value
      G.meta.redrawQuota,
      // validate control
      isHost,
      isControlDisabled,
      // open state
      state.settingsOpen,
    ]);

    const playerSettingsPanel = useMemo(() => {
      const handleClose = () => {
        setState((state) => ({
          ...state,
          playerMenuAnchorEl: null,
        }));
      };
      const selectedPlayerID = state.selectedPlayer.toString();
      const selectedPlayerIdx = G.meta.players.indexOf(selectedPlayerID);
      return (
        <Menu
          anchorEl={state.playerMenuAnchorEl}
          open={state.playerMenuAnchorEl != null}
          onClose={handleClose}
        >
          {match.playerID == selectedPlayerID ? null : (
            <MenuItem
              disabled={!isPreparing}
              onClick={() => {
                console.assert(+selectedPlayerID != 0);
                match.send("UpdateHost", selectedPlayerID);
                handleClose();
              }}
            >
              Make host
            </MenuItem>
          )}
          <MenuItem
            disabled={
              !isPreparing ||
              (selectedPlayerIdx < 0 && G.meta.players.length >= 2)
            }
            onClick={() => {
              match.send("ToggleRole", selectedPlayerID);
              handleClose();
            }}
          >
            {`Make ${selectedPlayerIdx < 0 ? "player" : "spectator"}`}
          </MenuItem>
        </Menu>
      );
    }, [
      // controller
      match,
      // G
      isPreparing,
      G.meta.players.join(":"),
      // state
      state.playerMenuAnchorEl,
      state.selectedPlayer,
    ]);

    const playersPanel = useMemo(() => {
      const { matchData } = match.client;
      return (
        <Grid item xs={12}>
          <Stack direction="row" spacing={3}>
            {matchData.slice(1).map(({ id, name, isConnected }) => {
              const playerID = id.toString();
              let role: Role = "spectator";
              const idx = G.meta.players.indexOf(playerID);
              if (idx >= 0) {
                if (isSpectator) {
                  role = ["alpha", "bravo"][idx] as Role;
                } else {
                  role = ["alpha", "bravo"][
                    id == +match.playerID ? 0 : 1
                  ] as Role;
                }
              }
              return (
                <Box key={id}>
                  <PlayerAvatar
                    online={isConnected}
                    name={name}
                    role={role}
                    ready={G.buffer.ready[id]}
                    host={playerID == G.meta.host}
                    self={playerID == match.playerID}
                    onClick={({ currentTarget }) =>
                      isHost &&
                      setState((state) => ({
                        ...state,
                        selectedPlayer: id,
                        playerMenuAnchorEl: currentTarget,
                      }))
                    }
                  />
                </Box>
              );
            })}
          </Stack>
        </Grid>
      );
    }, [
      // controller
      match,
      // G
      match.client.matchData.map((e) => +e.isConnected).join(":"),
      G.meta.players.join(":"),
      G.meta.host,
      G.buffer.ready.map((e) => +e).join(":"),
    ]);

    const bottomPanel = useMemo(() => {
      const shareInviteLink = async () => {
        const url = new URL(System.url.origin);
        url.searchParams.append("connect", "player");
        url.searchParams.append("match", match.matchID);
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(url.href);
          MessageBar.success(`invite link copied: [${url.href}]`);
        } else {
          console.log(url.href);
          MessageBar.warning(`logged to console since context is not secure`);
        }
      };
      return (
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
              <BasicButton fullWidth onClick={shareInviteLink}>
                Share Invite Link
              </BasicButton>
            </Grid>
            <Grid item xs={6}>
              <Tooltip
                followCursor
                placement="top"
                title={
                  !isPlayersEnough
                    ? "Need two players to start a match"
                    : !isPlayersReady
                    ? "Waiting for other player to get ready"
                    : "Waiting for host to start the match"
                }
              >
                <div>
                  <BasicButton
                    fullWidth
                    selected={isReady}
                    disabled={
                      !isPreparing ||
                      (isHost && !(isPlayersEnough && isPlayersReady)) ||
                      (!isHost && isSpectator)
                    }
                    onClick={() => match.send("ToggleReady")}
                  >
                    {isHost ? "Start!" : "Ready!"}
                  </BasicButton>
                </div>
              </Tooltip>
            </Grid>
          </Grid>
        </Box>
      );
    }, [
      // controller
      match,
      // ready
      isReady,
      // validate control
      isHost,
      isSpectator,
      isPreparing,
      isPlayersEnough,
      isPlayersReady,
    ]);

    return (
      <div>
        <Grid container spacing={4} sx={{ p: 2, flexGrow: 1 }}>
          {playerSettingsPanel}
          {playersPanel}
          {mainPanel}
          {settingsPanel}
        </Grid>
        {bottomPanel}
      </div>
    );
  }
}

export const MatchActivity = new MatchActivity_0();
