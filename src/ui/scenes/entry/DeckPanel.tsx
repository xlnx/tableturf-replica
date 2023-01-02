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
import { useEffect, useState } from "react";
import { getCardById } from "../../../core/Tableturf";

interface DeckPanelProps {
  invalidateCards: number[];
  cards: number[];
  card: number;
  deck: number;
  decks: IDeckData[];
}

class DeckPanel_0 extends ReactComponent<DeckPanelProps> {
  init(): DeckPanelProps {
    return {
      invalidateCards: [],
      cards: [],
      card: -1,
      deck: 0,
      decks: DB.read().decks.slice(),
    };
  }

  render() {
    useEffect(() => {
      DB.subscribe(() => this.update({ decks: DB.read().decks.slice() }));
    }, []);

    useEffect(() => {
      this.update({ cards: this.props.decks[this.props.deck].deck.slice() });
    }, [this.props.deck, this.props.decks]);

    const { cards } = this.props;
    const area = cards
      .map((card) => getCardById(card).count.area)
      .reduce((a, b) => a + b, 0);

    const deckMenuItems = this.props.decks.map(({ name }, i) => (
      <MenuItem value={i} key={i}>
        {name}
      </MenuItem>
    ));

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
          <Grid
            container
            sx={{
              width: "100%",
              height: "100%",
              overflow: "hidden",
              flex: 1,
              pl: 1,
              pr: 1,
            }}
          >
            {cards.map((card) => (
              <Grid item xs={4} key={card}>
                <Box sx={{ p: 1 }}>
                  <CardSmall
                    width={123}
                    card={card}
                    active={this.props.invalidateCards.indexOf(card) < 0}
                    selected={this.props.card == card}
                    // onClick={() => this.selectCard(card)}
                  ></CardSmall>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
    );
  }
}

export const DeckPanel = new DeckPanel_0();
