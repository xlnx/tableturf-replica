import { Box, Paper } from "@mui/material";
import { ReactComponent } from "../../../engine/ReactComponent";
import { DarkButton } from "../../Theme";
import { Hands } from "./Hands";
import { useEffect } from "react";
import { enumerateBoardMoves, getCardById } from "../../../core/Tableturf";

type PartialMove = Omit<Omit<IPlayerMovement, "player">, "params">;
type Action = "discard" | "trivial" | "special";

interface MatchState {
  player: IPlayerId;
  handMask: boolean[];
  handSpMask: boolean[];
}

interface PlayerPanelProps {
  enabled: boolean;
  selected: number;
  action: Action;
  state: MatchState;
  onUpdateMove: (move: PartialMove) => void;
  onClick: (hand: number) => void;
  onPreview: (card: number) => void;
}

export class PlayerPanel extends ReactComponent<PlayerPanelProps> {
  private readonly hands = (() => {
    const hands = new Hands();
    hands.update({
      onClick: (i) => {
        this.props.onClick(i);
      },
      onChange: (i) => {
        this.props.onUpdateMove({
          action: this.props.action,
          hand: i,
        });
        this.update({ selected: i });
      },
    });
    return hands;
  })();

  init(): PlayerPanelProps {
    return {
      enabled: true,
      selected: -1,
      action: "trivial",
      state: null,
      onUpdateMove: () => {},
      onClick: () => {},
      onPreview: () => {},
    };
  }

  async reset(G: IMatchState, player: IPlayerId) {
    await this.updateState(G.game, player);
    const playerState = G.game.players[player];
    const cards = playerState.hand;
    await this.hands.update({
      cards,
      selected: -1,
    });
  }

  async uiUpdate(G: IMatchState) {
    const { player } = this.props.state;
    const cards = G.game.players[player].hand.slice();
    const isRedraw = G.game.round == 12 && !G.buffer.moves[player];
    if (!isRedraw) {
      const { hand } = G.buffer.history.slice(-1)[0][player];
      for (let i = 0; i < 4; ++i) {
        if (i != hand) {
          cards[i] = null;
        }
      }
    }
    await this.updateState(G.game, player);
    await this.hands.uiUpdate(cards);
  }

  private async updateState(game: IGameState, player: IPlayerId) {
    const playerState = game.players[player];
    const cards = playerState.hand;
    const handMask = cards.map(
      (card) =>
        card && enumerateBoardMoves(game, player, card, false).length > 0
    );
    const handSpMask = cards.map(
      (card) =>
        card &&
        getCardById(card).count.special <= playerState.count.special &&
        enumerateBoardMoves(game, player, card, true).length > 0
    );
    await this.update({
      action: "trivial",
      state: {
        player,
        handMask,
        handSpMask,
      },
    });
  }

  render() {
    useEffect(() => {
      if (!this.props.enabled) {
        return;
      }
      const card =
        this.props.selected >= 0
          ? this.hands.props.cards[this.props.selected]
          : -1;
      if (this.props.action == "discard" && card >= 0) {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.props.onPreview(card);
    }, [this.props.selected, this.props.enabled, this.props.action]);

    useEffect(() => {
      if (!this.props.state) {
        return;
      }
      let selected = this.props.selected;
      let mask = this.props.state.handMask;
      if (this.props.action == "discard") {
        mask = Array(4).fill(true);
        selected = -1;
      }
      if (this.props.action == "special") {
        mask = this.props.state.handSpMask;
        if (!mask[selected]) {
          selected = -1;
        }
      }
      this.hands.update({ selected, mask });
    }, [this.props.action, this.props.state]);

    useEffect(() => {
      this.hands.update({
        enabled: this.props.enabled,
        selected: -1,
      });
    }, [this.props.enabled]);

    return (
      <>
        <Paper
          sx={{
            position: "absolute",
            left: 0,
            top: 135,
            width: 545,
            height: 675,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            boxShadow: "2px 2px rgba(0, 0, 0, 0.4)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              left: 28,
              top: 25,
              width: 510,
              height: 640,
            }}
          >
            {this.hands.node}
          </Box>
        </Paper>
        <DarkButton
          disabled={!this.props.enabled}
          selected={this.props.enabled && this.props.action == "discard"}
          sx={{
            position: "absolute",
            left: 42,
            top: 838,
            width: 220,
            height: 90,
            "&.Mui-selected": {
              backgroundColor: "#d2e332dd",
            },
            "&.Mui-selected:hover": {
              backgroundColor: "#d2e332ff",
            },
          }}
          onClick={() =>
            this.update({
              action: this.props.action != "discard" ? "discard" : "trivial",
            })
          }
        >
          Pass
        </DarkButton>
        <DarkButton
          disabled={!this.props.enabled}
          selected={this.props.enabled && this.props.action == "special"}
          sx={{
            position: "absolute",
            left: 292,
            top: 838,
            width: 220,
            height: 90,
            "&.Mui-selected": {
              backgroundColor: "#d2e332dd",
            },
            "&.Mui-selected:hover": {
              backgroundColor: "#d2e332ff",
            },
          }}
          onClick={() =>
            this.update({
              action: this.props.action != "special" ? "special" : "trivial",
            })
          }
        >
          Special Attack!
        </DarkButton>
      </>
    );
  }
}
