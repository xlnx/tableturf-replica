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
import { getCards } from "../../../core/Tableturf";
import { CardVaultPanel } from "./CardVaultPanel";
import { AlertDialog } from "../../components/AlertDialog";
import { getDeckTotalArea } from "../../../Terms";

interface DeckPanelProps {
  excludeCards: number[];
  deck: number;
  cards: number[];
  card: number;
  editing: boolean;
  onClickCard: (card: number) => void;
  version: number;
}

class DeckPanel_0 extends ReactComponent<DeckPanelProps> {
  init(): DeckPanelProps {
    return {
      excludeCards: [],
      deck: 0,
      cards: DB.read().decks[0].deck.slice(),
      card: -1,
      editing: false,
      onClickCard: () => {},
      version: 0,
    };
  }

  componentDidMount(): void {
    DB.subscribe(() => this.update({ version: this.props.version + 1 }));
  }

  async edit() {
    await this.update({ editing: true });
    await CardVaultPanel.prompt();
    // must point to some certain deck after edit
    const deck = Math.max(0, this.props.deck);
    await this.update({
      editing: false,
      deck,
      cards: DB.read().decks[deck].deck,
    });
  }

  listOriginalCards() {
    return this.props.deck < 0
      ? this.props.cards
      : DB.read().decks[this.props.deck].deck;
  }

  async confirmUpdateDeck(): Promise<boolean> {
    const original = this.listOriginalCards();
    const isModified =
      this.props.deck < 0 ||
      JSON.stringify(this.props.cards) != JSON.stringify(original);
    if (isModified) {
      const ok = await AlertDialog.prompt({
        msg: "Your changes will be lost, confirm?",
        okMsg: "Ok",
        cancelMsg: "Cancel",
      });
      return ok;
    }
    return true;
  }

  render() {
    useEffect(() => {
      if (this.props.editing) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        CardVaultPanel.update({ excludeCards: DeckPanel.props.cards });
      }
    }, [this.props.cards, this.props.editing]);

    const { decks } = DB.read();
    const deckMenuItems = decks.map(({ name }, i) => (
      <MenuItem value={i} key={i}>
        {name}
      </MenuItem>
    ));

    const ctrlPanel = useMemo(() => {
      const original = this.listOriginalCards();
      const area = getDeckTotalArea(this.props.cards);
      const isModified =
        this.props.deck < 0 ||
        JSON.stringify(this.props.cards) != JSON.stringify(original);

      const handleChange = async (e) => {
        const ok = await this.confirmUpdateDeck();
        if (!ok) {
          return;
        }
        const deck = +e.target.value;
        await this.update({
          deck,
          cards: decks[deck].deck,
        });
      };

      return (
        <Grid
          container
          spacing={1}
          sx={{ width: "100%", p: 2, pt: 0 }}
          justifyContent="flex-end"
          alignItems="flex-end"
        >
          <Grid item xs={9}>
            <TextField
              select
              fullWidth
              variant="standard"
              label="Deck"
              autoComplete="off"
              value={-1}
              onChange={handleChange}
            >
              <MenuItem value={-1} sx={{ display: "none" }}>
                {(this.props.deck < 0
                  ? "[Untitled]"
                  : decks[this.props.deck].name) + (isModified ? " [*]" : "")}
              </MenuItem>
              {deckMenuItems}
            </TextField>
          </Grid>
          <Grid item xs={1}>
            <Typography>{area}</Typography>
          </Grid>
        </Grid>
      );
    }, [this.props.deck, this.props.cards]);

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
