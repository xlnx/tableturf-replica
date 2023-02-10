import "./CardVaultPanel.less";

import fuzzysort from "fuzzysort";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  MenuItem,
  Paper,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import { CardLarge } from "../../components/CardLarge";
import { getCardById, getCards } from "../../../core/Tableturf";
import { I18n } from "../../../i18n/I18n";
import { ReactComponent } from "../../../engine/ReactComponent";
import { DeckSaveDialog } from "./DeckSaveDialog";
import { DeckPanel } from "./DeckPanel";
import { MessageBar } from "../../components/MessageBar";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ShareIcon from "@mui/icons-material/Share";
import SaveIcon from "@mui/icons-material/Save";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { DeckShareDialog } from "./DeckShareDialog";

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
    label: "Rarity",
    key: ({ rarity }: ICard) => ["Common", "Rare", "Fresh"].indexOf(rarity),
    cmp: numberComparator,
  },
  {
    label: "Category",
    key: ({ category }: ICard) => category,
    cmp: stringComparator,
  },
  {
    label: "Block Count",
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
        const id = +query;
        if (!isNaN(id) && getCardById(id)) {
          cards.push(id);
        }
        cards.push(
          ...fuzzysort
            .go(query, allCards, { key: "name" })
            .map((e) => e.obj.id)
            .filter((e) => e != id)
        );
      }
      cards = cards
        .map(getCardById)
        .map((card) => ({ key: key(card), id: card.id }))
        .sort((a, b) => cmp(a.key, b.key) * (reverse ? -1 : 1))
        .map(({ id }) => id);
      setState((state) => ({ ...state, cards }));
    }, [query, sorter, reverse]);

    const topBar = useMemo(() => {
      const sortMenuItems = sorters.map(({ label }, i) => (
        <MenuItem value={i} key={i}>
          {label}
        </MenuItem>
      ));

      const handleQuitEdit = async () => {
        const ok = await DeckPanel.confirmUpdateDeck();
        if (!ok) {
          return;
        }
        this.props.resolve();
      };

      return (
        <Grid
          container
          spacing={2}
          sx={{ width: "100%", pb: 2 }}
          // justifyContent="center"
          alignItems="flex-end"
        >
          <Grid item sx={{ flexGrow: 1 }}>
            <TextField
              fullWidth
              variant="standard"
              label="Search..."
              autoComplete="off"
              onChange={(e) =>
                setState((state) => ({ ...state, query: e.target.value }))
              }
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              select
              fullWidth
              variant="standard"
              label="Sort"
              autoComplete="off"
              value={sorter}
              onChange={(e) =>
                setState((state) => ({ ...state, sorter: +e.target.value }))
              }
              InputProps={{
                startAdornment: (
                  <IconButton
                    onClick={() =>
                      setState((state) => ({ ...state, reverse: !reverse }))
                    }
                  >
                    {reverse ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                ),
              }}
            >
              {sortMenuItems}
            </TextField>
          </Grid>
          <Grid item>
            <Tooltip title="Share">
              <IconButton onClick={() => DeckShareDialog.prompt()}>
                <ShareIcon sx={{ fontSize: "2rem" }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Save As">
              <IconButton onClick={() => DeckSaveDialog.prompt()}>
                <SaveIcon sx={{ fontSize: "2rem" }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Quit Edit">
              <IconButton onClick={handleQuitEdit}>
                <ExitToAppIcon sx={{ fontSize: "2rem" }} />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      );
    }, [sorter, reverse, this.props.resolve]);

    const index = [];
    state.cards.forEach((id, i) => (index[id] = i));

    const cardPanel = useMemo(() => {
      const handleCardClick = (card: number) => async () => {
        const cards = DeckPanel.props.cards;
        if (cards.length >= 15) {
          MessageBar.warning("your deck is full");
          return;
        }
        await DeckPanel.update({ cards: [...cards, card] });
      };
      return (
        <Box
          sx={{
            position: "relative",
            overflow: "auto",
            height: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              transformOrigin: "top left",
              transform: `scale(${180 / 344})`,
            }}
          >
            {getCards().map((card) => {
              const idx = index[card.id];
              return (
                <div
                  className={
                    "card-margin " + (idx != null ? "" : "card-margin-hidden")
                  }
                  key={card.id}
                  style={{
                    transform: `translate(
                        ${(idx % 6) * 100}%, 
                        ${Math.floor(idx / 6) * 480}px
                      )`,
                  }}
                >
                  <CardLarge
                    width={180}
                    card={card.id}
                    active={this.props.excludeCards.indexOf(card.id) < 0}
                    onClick={handleCardClick(card.id)}
                  />
                </div>
              );
            })}
          </div>
        </Box>
      );
    }, [state.cards, this.props.excludeCards]);

    return (
      <Box
        className={`card-vault ${
          this.props.open ? "card-vault-open" : "card-vault-closed"
        }`}
      >
        <Paper
          sx={{
            position: "absolute",
            width: 1300,
            height: 1020,
            left: 1920 - 1300 - 32,
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
            {topBar}
            {cardPanel}
          </Box>
        </Paper>
      </Box>
    );
  }
}

export const CardVaultPanel = new CardVaultPanel_0();
