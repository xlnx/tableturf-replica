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
import { useEffect, useMemo } from "react";
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
      DB.subscribe(async () => {
        const decks = DB.read().decks;
        await this.update({
          decks,
          cards: decks[this.props.deck].deck,
        });
      });
    }, []);

    useEffect(() => {
      if (this.props.editing) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
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

    const ctrlPanel = useMemo(
      () => (
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
              onChange={async (e) => {
                const deck = +e.target.value;
                await this.update({
                  deck,
                  cards: this.props.decks[deck].deck,
                });
              }}
            >
              {deckMenuItems}
            </TextField>
          </Grid>
          <Grid item xs={2}>
            <Typography>{area}</Typography>
          </Grid>
        </Grid>
      ),
      [this.props.deck, this.props.cards]
    );

    const handleCardClick = useMemo(
      () =>
        getCards().map(({ id: card }) => async () => {
          if (!this.props.editing) {
            await this.update({ card });
            this.props.onClickCard(card);
          } else {
            const cards = this.props.cards.slice();
            cards.splice(cards.indexOf(card), 1);
            await this.update({ cards });
          }
        }),
      []
    );

    const cardsPanel = useMemo(
      () => (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            flex: 1,
            pl: 1,
            pr: 1,
          }}
        >
          {this.props.cards.map((id, i) => (
            <Box
              key={id}
              sx={{
                p: 1,
                position: "absolute",
                transform: `translate(
                  ${(i % 3) * 108}%,
                  ${Math.floor(i / 3) * 174}px
                )`,
              }}
            >
              <CardSmall
                width={123}
                card={id}
                active={
                  this.props.editing || this.props.excludeCards.indexOf(id) < 0
                }
                selected={!this.props.editing && this.props.card == id}
                onClick={handleCardClick[id - 1]}
              ></CardSmall>
            </Box>
          ))}
        </Box>
      ),
      [
        this.props.cards,
        this.props.card,
        this.props.editing,
        this.props.excludeCards,
      ]
    );

    return (
      <Paper
        sx={{
          position: "absolute",
          width: 520,
          height: 1020,
          left: 32,
          top: 24,
          p: 4,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          boxShadow: "5px 5px 2px rgba(0, 0, 0, 0.3)",
        }}
      >
        {ctrlPanel}
        {cardsPanel}
      </Paper>
    );
  }
}

export const DeckPanel = new DeckPanel_0();
