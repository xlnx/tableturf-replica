import fuzzysort from "fuzzysort";
import { useEffect, useState } from "react";
import { Box, Grid, MenuItem, Paper, TextField } from "@mui/material";
import { CardLarge } from "../../components/CardLarge";
import { getCardById, getCards } from "../../../core/Tableturf";
import { I18n } from "../../../i18n/I18n";
import { BasicButton } from "../../Theme";
import { ReactComponent } from "../../../engine/ReactComponent";

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
}

class CardVaultPanel_0 extends ReactComponent<CardVaultProps> {
  init() {
    return {
      open: false,
    };
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

    const renderCard = (card: ICard) => {
      return (
        <Box sx={{ p: 1 }}>
          <CardLarge
            width={180}
            card={card.id}
            onClick={() => console.log(card.id)}
          ></CardLarge>
        </Box>
      );
    };

    const sortMenuItems = sorters.map(({ label }, i) => (
      <MenuItem value={i} key={i}>
        {label}
      </MenuItem>
    ));

    const index = [];
    state.cards.forEach((id, i) => (index[id] = i));

    return (
      <Paper
        sx={{
          position: "absolute",
          width: 1300,
          height: 1020,
          left: this.props.open ? 600 : 1920,
          top: 24,
          p: 4,
          boxSizing: "border-box",
          boxShadow: "5px 5px 2px rgba(0, 0, 0, 0.3)",
          transition: `left ${400}ms cubic-bezier(0.65, 0, 0.35, 1)`,
          pointerEvents: this.props.open ? "all" : "none",
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
            <Grid item xs={4}>
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
            <Grid item xs={2}>
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
                onClick={() => this.update({ open: false })}
              >
                Close
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
            {getCards().map((card, i) =>
              index[card.id] != null ? (
                <Box
                  key={card.id}
                  sx={{
                    position: "absolute",
                    left: `${((index[card.id] % 6) / 6) * 100}%`,
                    top: `${Math.floor(index[card.id] / 6) * 270}px`,
                  }}
                >
                  {renderCard(card)}
                </Box>
              ) : (
                <Box
                  key={card.id}
                  sx={{
                    position: "absolute",
                    // TODO: visibility hidden has some performance issue with chrome v108
                    // move the element out of screen to overcome this issue
                    opacity: 0,
                    left: -1e5,
                    top: -1e5,
                  }}
                >
                  {renderCard(card)}
                </Box>
              )
            )}
          </Box>
        </Box>
      </Paper>
    );
  }
}

export const CardVaultPanel = new CardVaultPanel_0();
