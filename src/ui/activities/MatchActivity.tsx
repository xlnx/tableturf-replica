import { useState } from "react";
import { Box, Grid, MenuItem, TextField } from "@mui/material";
import { Activity, ActivityPanel } from "../Activity";
import { RootActivity } from "./RootActivity";
import { BasicButton, Collapsible } from "../Theme";
import { getLogger } from "loglevel";
import { StarterDeck, TableturfClientState } from "../../Game";
import { Client } from "../../client/Client";
import { AlertDialog } from "../components/AlertDialog";
import { P2PHost } from "../../client/P2P";
import { MessageBar } from "../components/MessageBar";
import { System } from "../../engine/System";
import { MatchWindow } from "../scenes/match/MatchWindow";
import { InkResetAnimation } from "../InkResetAnimation";
import { EntryWindow } from "../scenes/entry/EntryWindow";
import { getStages, isValidDeck } from "../../core/Tableturf";
import { I18n } from "../../i18n/I18n";
import { DB } from "../../Database";

const logger = getLogger("main-dialog");
logger.setLevel("info");

interface OperationInfo {
  hostOnly?: boolean;
  phase?: string;
}

interface MatchActivityProps {
  client: Client;
  player: IPlayerId;
  state: TableturfClientState;
  deck: IDeckData;
  botDeck: IDeckData;
  manualExit: boolean;
}

const defaultDeck: IDeckData = {
  name: "Starter Deck",
  deck: StarterDeck.slice(),
};

const autoDeck: IDeckData = {
  name: "[Auto]",
  deck: null,
};

class MatchActivity_0 extends Activity<MatchActivityProps> {
  init() {
    const { currDeck, decks } = DB.read();
    let deck = { ...decks[currDeck] };
    if (!isValidDeck(deck.deck)) {
      deck = defaultDeck;
    }
    return {
      zIndex: 10,
      title: "Match",
      parent: () => RootActivity,
      //
      client: null,
      player: 0 as IPlayerId,
      state: null,
      deck,
      botDeck: defaultDeck,
      manualExit: false,
    };
  }

  async start(client: Client) {
    console.assert(client.isConnected());
    await this.update({
      client,
      player: client.playerId,
      state: client.state,
      manualExit: false,
    });
    await this.setupBot();
    client.on("update", this.handleUpdate.bind(this));
    client.on("disconnect", async () => {
      await this.handleDisconnect();
      await this.props.parent().show();
    });
    MatchWindow.bind(client);
    await this.show();
  }

  async back() {
    console.assert(this.props.client);
    const ok = await AlertDialog.prompt({
      msg: "Leave the room now?",
    });
    if (ok) {
      await this.update({ manualExit: true });
      this.props.client.stop();
      await this.handleDisconnect();
    }
    return ok;
  }

  private async handleDisconnect() {
    await this.update({ client: null });
    await this.uiHandlePlayerLeave();
  }

  private async uiHandlePlayerLeave() {
    logger.debug("uiHandlePlayerLeave");
    MessageBar.warning("${player} left the room");
    if (!this.props.manualExit) {
      await AlertDialog.prompt({
        msg: "A communication error has occurred",
        cancelMsg: null,
      });
    }
    await InkResetAnimation.play(async () => {
      MatchWindow.send("cancel");
      await ActivityPanel.show();
      EntryWindow.show();
    });
  }

  private async setupBot() {
    if (!this.isVsBot()) {
      return;
    }
    const { support } = this.props.client.botInfo;
    if (support.stages.length) {
      this.props.client.send("updateState", { stage: support.stages[0] });
    }
    await this.update({ botDeck: autoDeck });
  }

  private async handleUpdate(
    state: TableturfClientState,
    { G: G0, ctx: ctx0 }: TableturfClientState
  ) {
    const { G, ctx } = state;

    const enter = (phase: string) =>
      ctx.phase == phase && ctx0.phase != ctx.phase;

    for (let i = 0; i < 2; ++i) {
      if (!G.players[i] && !!G0.players[i]) {
        await this.uiHandlePlayerLeave();
      }
    }

    // botInitHook
    if (enter("botInitHook")) {
      this.props.client.send("sync");
    }

    // init
    if (enter("init")) {
      await InkResetAnimation.play(async () => {
        await MatchWindow.uiReset(G);
        this.props.client.send("sync");
        await ActivityPanel.hide();
        MatchWindow.show();
      });
    }

    await this.update({ state });
  }

  isReady() {
    return this.props.client && this.props.state.G.ready[this.props.player];
  }

  isForbidden({ hostOnly = false, phase = "prepare" }: OperationInfo = {}) {
    if (!this.props.client) {
      return true;
    }
    if (phase && this.props.state.ctx.phase != phase) {
      return true;
    }
    if (hostOnly && !this.props.client.isHost()) {
      return true;
    }
    return false;
  }

  isVsBot() {
    return this.props.client && this.props.client.botInfo;
  }

  isStageSupported(stage: number) {
    if (!this.props.client) {
      return false;
    }
    const { botInfo } = this.props.client;
    if (!botInfo || !botInfo.support.stages.length) {
      return true;
    }
    return botInfo.support.stages.indexOf(stage) >= 0;
  }

  render() {
    const shareInviteLink = async () => {
      const url = new URL(System.url.origin);
      url.searchParams.append("connect", "player");
      url.searchParams.append("match", this.props.client.matchId);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url.href);
        MessageBar.success(`successfully copied invite link to clipboard`);
      } else {
        console.log(url.href);
        MessageBar.warning(`logged to console since context is not secure`);
      }
    };

    let copyInviteLinkBtn = null;
    if (this.props.client && this.props.client instanceof P2PHost) {
      copyInviteLinkBtn = (
        <Grid item xs={6}>
          <BasicButton
            fullWidth
            disabled={this.isForbidden({ hostOnly: true })}
            onClick={shareInviteLink}
          >
            Share Invite Link
          </BasicButton>
        </Grid>
      );
    }

    const stageMenuItems = getStages().map((stage) => (
      <MenuItem
        value={stage.id}
        key={stage.id}
        disabled={!this.isStageSupported(stage.id)}
      >
        {I18n.localize("CommonMsg/MiniGame/MiniGameMapName", stage.name)}
      </MenuItem>
    ));

    const decks = DB.read().decks.slice();
    const deckMenuItems = decks.map(({ name, deck }, i) => (
      <MenuItem value={i} key={i} disabled={!isValidDeck(deck)}>
        {name}
      </MenuItem>
    ));

    const [botPanelState, setBotPanelState] = useState({
      open: false,
    });

    const renderBotPanel = () => {
      const { botInfo } = this.props.client;
      const useCustomDeck = !botInfo.support.decks.length;
      const decks = [
        autoDeck,
        ...(useCustomDeck ? DB.read().decks : botInfo.support.decks),
      ];
      const deckMenuItems = decks.map(({ name, deck }, i) => (
        <MenuItem value={i} key={i} disabled={deck && !isValidDeck(deck)}>
          {name}
        </MenuItem>
      ));
      return (
        <Collapsible
          open={botPanelState.open}
          onClick={() =>
            setBotPanelState({
              ...botPanelState,
              open: !botPanelState.open,
            })
          }
          maxBodyHeight={100}
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                variant="standard"
                label="Deck"
                disabled={
                  this.isForbidden({ hostOnly: true }) || this.isReady()
                }
                value={-1}
                onChange={({ target }) =>
                  this.update({ botDeck: decks[+target.value] })
                }
              >
                <MenuItem value={-1} sx={{ display: "none" }}>
                  {this.props.botDeck.name +
                    (useCustomDeck && this.props.botDeck.deck
                      ? " [Snapshot]"
                      : "")}
                </MenuItem>
                {deckMenuItems}
              </TextField>
            </Grid>
          </Grid>
        </Collapsible>
      );
    };

    return (
      <>
        <Grid container spacing={4} sx={{ p: 2, flexGrow: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              variant="standard"
              label="Stage"
              disabled={this.isForbidden({ hostOnly: true }) || this.isReady()}
              value={this.props.state.G.stage}
              onChange={({ target }) =>
                this.props.client.send("updateState", { stage: +target.value })
              }
            >
              {stageMenuItems}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              variant="standard"
              label="Deck"
              disabled={this.isForbidden() || this.isReady()}
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
          </Grid>
          {!this.isVsBot() ? null : (
            <Grid item xs={12} sx={{ p: 2 }}>
              {renderBotPanel()}
            </Grid>
          )}
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
            {copyInviteLinkBtn}
            <Grid item xs={6}>
              <BasicButton
                fullWidth
                selected={this.props.state.G.ready[this.props.player]}
                disabled={this.isForbidden()}
                onClick={() => {
                  if (this.isVsBot()) {
                    const players = this.props.state.G.players;
                    console.assert(this.props.player == 0);
                    this.props.client.send("updateState", {
                      players: [
                        { ...players[0], deck: this.props.deck.deck },
                        { ...players[1], deck: this.props.botDeck.deck },
                      ],
                    });
                  } else {
                    this.props.client.send("updatePlayerInfo", {
                      deck: this.props.deck.deck,
                    });
                  }
                  this.props.client.send("toggleReady");
                }}
              >
                Ready!
              </BasicButton>
            </Grid>
          </Grid>
        </Box>
      </>
    );
  }
}

export const MatchActivity = new MatchActivity_0();
