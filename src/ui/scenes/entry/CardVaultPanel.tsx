import fuzzysort from "fuzzysort";
import { useEffect, useState } from "react";
import { Box, Grid, MenuItem, Paper, TextField } from "@mui/material";
import { CardLarge } from "../../components/CardLarge";
import { getCardById, getCards } from "../../../core/Tableturf";
import { I18n } from "../../../i18n/I18n";
import { BasicButton } from "../../Theme";
import { ReactComponent } from "../../../engine/ReactComponent";
import { DeckSaveDialog } from "./DeckSaveDialog";
import { DeckPanel } from "./DeckPanel";
import { MessageBar } from "../../components/MessageBar";

const allCards = getCards().map(({ id, name }) => ({
  id,
  name: fuzzysort.prepare(
    I18n.localize("CommonMsg/MiniGame/MiniGameCardName", name)
  ),
}));

const numberComparator = (a, b) => a - b;
const stringComparator = (a, b) => a.localeCompare(b);
const sorters = [
  { label: "ID", key: ({ id }: ICard) => id, cmp: numberComparator },
  {
    label: "Name",
    key: ({ name }: ICard) =>
      I18n.localize("CommonMsg/MiniGame/MiniGameCardName", name),
    cmp: stringComparator,
  },
  {
    label: "Season",
    key: ({ season }: ICard) => season,
    cmp: numberComparator,
  },
  {
    label: "Category",
    key: ({ category }: ICard) => category,
    cmp: stringComparator,
  },
  {
    label: "Area",
    key: ({ count }: ICard) => count.area,
    cmp: numberComparator,
  },
  {
    label: "Special Cost",
    key: ({ count }: ICard) => count.special,
    cmp: numberComparator,
  },
];

interface CardVaultProps {
  open: boolean;
  excludeCards: number[];
  resolve: any;
}

class CardVaultPanel_0 extends ReactComponent<CardVaultProps> {
  init() {
    return {
      open: false,
      excludeCards: [],
      resolve: () => {},
    };
  }

  async prompt() {
    let resolve;
    const promise = new Promise((_) => (resolve = _));
    await this.update({
      open: true,
      resolve: async () => {
        await this.update({ open: false });
        resolve();
      },
    });
    return await promise;
  }

  render() {
    const [state, setState] = useState({
      cards: allCards.map(({ id }) => id),
      sorter: 0,
      query: "",
      reverse: false,
    });

    const { query, sorter, reverse } = state;
    useEffect(() => {
      const { key, cmp } = sorters[sorter];
      let cards = [];
      if (query == "") {
        cards = allCards.map(({ id }) => id);
      } else {
        if (!isNaN(+query) && getCardById(+query)) {
          cards.push(+query);
        }
        cards.push(
          ...fuzzysort.go(query, allCards, { key: "name" }).map((e) => e.obj.id)
        );
      }
      cards = cards
        .map(getCardById)
        .map((card) => ({ key: key(card), id: card.id }))
        .sort((a, b) => cmp(a.key, b.key) * (reverse ? -1 : 1))
        .map(({ id }) => id);
      setState({ ...state, cards });
    }, [query, sorter, reverse]);

    const sortMenuItems = sorters.map(({ label }, i) => (
      <MenuItem value={i} key={i}>
        {label}
      </MenuItem>
    ));

    const handleCardClick = (card: number) => async () => {
      const cards = DeckPanel.props.cards;
      if (cards.length >= 15) {
        MessageBar.warning("your deck is full");
        return;
      }
      await DeckPanel.update({ cards: [...cards, card] });
    };

    const index = [];
    state.cards.forEach((id, i) => (index[id] = i));

    const x1 = 1920 - 1300 - 32;
    const dt = 300;
    return (
      <Paper
        className={this.props.open ? "card-vault-open" : "card-vault-closed"}
        sx={{
          position: "absolute",
          width: 1300,
          height: 1020,
          left: this.props.open ? x1 : x1 + 64,
          opacity: this.props.open ? 1 : 0,
          top: 24,
          p: 4,
          boxSizing: "border-box",
          boxShadow: "5px 5px 2px rgba(0, 0, 0, 0.3)",
          transition: `all ${dt}ms cubic-bezier(0.65, 0, 0.35, 1)`,
          pointerEvents: this.props.open ? "inherit" : "none",
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
            // justifyContent="center"
            alignItems="flex-end"
          >
            <Grid item xs={4}>
              <TextField
                fullWidth
                variant="standard"
                label="Search..."
                autoComplete="off"
                onChange={(e) => setState({ ...state, query: e.target.value })}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                select
                fullWidth
                variant="standard"
                label="Sort"
                autoComplete="off"
                value={state.sorter}
                onChange={(e) =>
                  setState({ ...state, sorter: +e.target.value })
                }
              >
                {sortMenuItems}
              </TextField>
            </Grid>
            <Grid item xs={1}>
              <BasicButton
                fullWidth
                selected={state.reverse}
                onClick={() => setState({ ...state, reverse: !state.reverse })}
              >
                Reverse
              </BasicButton>
            </Grid>
            <Grid item xs={2}>
              <BasicButton
                fullWidth
                onClick={() =>
                  DeckSaveDialog.prompt(
                    DeckPanel.props.deck,
                    DeckPanel.props.cards.slice()
                  )
                }
              >
                Save As
              </BasicButton>
            </Grid>
            <Grid item xs={2}>
              <BasicButton fullWidth onClick={() => this.props.resolve()}>
                Quit Edit
              </BasicButton>
            </Grid>
          </Grid>
          <Box
            sx={{
              position: "relative",
              overflow: "auto",
              height: 0,
              flex: 1,
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
                      ${(idx % 6) * 100}%, 
                      ${Math.floor(idx / 6) * 270}px
                    )`,
                    pointerEvents: visible ? "inherit" : "none",
                  }}
                >
                  <CardLarge
                    width={180}
                    card={card.id}
                    active={this.props.excludeCards.indexOf(card.id) < 0}
                    onClick={handleCardClick(card.id)}
                  ></CardLarge>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Paper>
    );
  }
}

export const CardVaultPanel = new CardVaultPanel_0();
