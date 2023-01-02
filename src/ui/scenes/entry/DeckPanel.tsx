import {
  Box,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { CardSmall } from "../../components/CardSmall";
import { ReactComponent } from "../../../engine/ReactComponent";
import { DB } from "../../../Database";
import { useEffect } from "react";
import { getCardById, getCards } from "../../../core/Tableturf";
import { CardVaultPanel } from "./CardVaultPanel";

interface DeckPanelProps {
  excludeCards: number[];
  decks: IDeckData[];
  deck: number;
  cards: number[];
  card: number;
  editing: boolean;
  onClickCard: (card: number) => void;
}

class DeckPanel_0 extends ReactComponent<DeckPanelProps> {
  init(): DeckPanelProps {
    return {
      excludeCards: [],
      decks: DB.read().decks.slice(),
      deck: 0,
      cards: [],
      card: -1,
      editing: false,
      onClickCard: () => {},
    };
  }

  async edit() {
    await this.update({ editing: true });
    await CardVaultPanel.prompt();
    await this.update({
      editing: false,
      cards: this.props.decks[this.props.deck].deck.slice(),
    });
  }

  render() {
    useEffect(() => {
      DB.subscribe(() => this.update({ decks: DB.read().decks.slice() }));
    }, []);

    useEffect(() => {
      this.update({ cards: this.props.decks[this.props.deck].deck.slice() });
    }, [this.props.deck, this.props.decks]);

    useEffect(() => {
      if (this.props.editing) {
        CardVaultPanel.update({ excludeCards: DeckPanel.props.cards });
      }
    }, [this.props.cards, this.props.editing]);

    const area = this.props.cards
      .map((card) => getCardById(card).count.area)
      .reduce((a, b) => a + b, 0);

    const deckMenuItems = this.props.decks.map(({ name }, i) => (
      <MenuItem value={i} key={i}>
        {name}
      </MenuItem>
    ));

    const handleCardClick = (card: number, i: number) => async () => {
      if (!this.props.editing) {
        await this.update({ card });
        this.props.onClickCard(card);
      } else {
        const cards = this.props.cards.slice();
        cards.splice(i, 1);
        await this.update({ cards });
      }
    };

    const index = [];
    this.props.cards.forEach((id, i) => (index[id] = i));

    return (
      <Paper
        sx={{
          position: "absolute",
          width: 520,
          height: 1020,
          left: 32,
          top: 24,
          p: 4,
          boxSizing: "border-box",
          boxShadow: "5px 5px 2px rgba(0, 0, 0, 0.3)",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Grid
            container
            spacing={2}
            sx={{ width: "100%", pb: 2 }}
            justifyContent="flex-end"
            alignItems="flex-end"
          >
            <Grid item xs={7}>
              <TextField
                select
                fullWidth
                variant="standard"
                label="Deck"
                autoComplete="off"
                value={this.props.deck}
                onChange={(e) => this.update({ deck: +e.target.value })}
              >
                {deckMenuItems}
              </TextField>
            </Grid>
            <Grid item xs={2}>
              <Typography>{area}</Typography>
            </Grid>
          </Grid>
          <Box
            sx={{
              width: "100%",
              height: "100%",
              overflow: "hidden",
              flex: 1,
              pl: 1,
              pr: 1,
            }}
          >
            {getCards().map((card) => {
              const idx = index[card.id];
              const visible = idx != null;
              return (
                <Box
                  key={card.id}
                  sx={{
                    p: 1,
                    position: "absolute",
                    opacity: visible ? 1 : 0,
                    transform: `translate(
                      ${(idx % 3) * 108}%,
                      ${Math.floor(idx / 3) * 174}px
                    )`,
                    pointerEvents: visible ? "inherit" : "none",
                  }}
                >
                  <CardSmall
                    width={123}
                    card={card.id}
                    active={
                      this.props.editing ||
                      this.props.excludeCards.indexOf(card.id) < 0
                    }
                    selected={!this.props.editing && this.props.card == card.id}
                    onClick={handleCardClick(card.id, idx)}
                  ></CardSmall>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Paper>
    );
  }
}

export const DeckPanel = new DeckPanel_0();
