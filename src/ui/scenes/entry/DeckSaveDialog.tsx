import { ReactComponent } from "../../../engine/ReactComponent";
import { Dialog } from "../../components/Dialog";
import {
  Button,
  CardHeader,
  Divider,
  FormHelperText,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";
import { DB } from "../../../Database";
import { ReactNode } from "react";
import { MessageBar } from "../../components/MessageBar";
import { DeckPanel } from "./DeckPanel";

interface DeckSaveDialogProps {
  open: boolean;
  deck: number;
  name: string;
  cards: number[];
  resolve: any;
}

class DeckSaveDialog_0 extends ReactComponent<DeckSaveDialogProps> {
  init() {
    return {
      open: false,
      deck: 0,
      name: "",
      cards: [],
      resolve: () => {},
    };
  }

  async prompt(): Promise<boolean> {
    let resolve;
    const promise = new Promise<boolean>((_) => (resolve = _));
    const deck = DeckPanel.props.deck < 0 ? 0 : DeckPanel.props.deck;
    const cards = DeckPanel.props.cards.slice();
    await this.update({
      open: true,
      deck,
      name: "",
      cards,
      resolve: async (ok) => {
        await this.update({ open: false });
        resolve(ok);
      },
    });
    return await promise;
  }

  render(): ReactNode {
    const deckMenuItems = DB.read().decks.map(({ name }, i) => (
      <MenuItem value={i} key={i}>
        {name}
      </MenuItem>
    ));

    let nameError = "";
    if (this.props.name != "") {
      if (this.props.name.trim() != this.props.name) {
        nameError = "leading/trailing space is not allowed";
      }
    }

    const handleSave = async () => {
      if (nameError) {
        return;
      }
      const name = this.props.name || DB.read().decks[this.props.deck].name;
      const deck = this.props.cards.slice();
      const decks = DB.read().decks.slice();
      decks[this.props.deck] = { name, deck };
      DB.update({ decks });
      MessageBar.success(`saved deck [${name}]`);
      await DeckPanel.update({ deck: this.props.deck, cards: deck });
      this.props.resolve(true);
    };

    return (
      <Dialog open={this.props.open}>
        <CardHeader title={"Save As"} />
        <Divider sx={{ pt: 2 }} />
        <Grid
          container
          spacing={2}
          justifyContent="flex-end"
          sx={{ width: 540, pt: 2 }}
        >
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              variant="standard"
              label="Slot"
              autoComplete="off"
              value={this.props.deck}
              onChange={(e) => this.update({ deck: +e.target.value })}
            >
              {deckMenuItems}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              variant="standard"
              label="Deck Name"
              autoComplete="off"
              color={!nameError ? "primary" : "error"}
              placeholder={DB.read().decks[this.props.deck].name}
              inputProps={{
                maxLength: 32,
                "aria-describedby": nameError
                  ? "deck-save-name-error-text"
                  : "",
              }}
              onChange={(e) => this.update({ name: e.target.value })}
            />
            {!nameError ? null : (
              <FormHelperText id="deck-save-name-error-text">
                {nameError}
              </FormHelperText>
            )}
          </Grid>
          <Grid item xs={3}>
            <Button fullWidth onClick={handleSave}>
              Save
            </Button>
          </Grid>
          <Grid item xs={3}>
            <Button fullWidth onClick={() => this.props.resolve(false)}>
              Cancel
            </Button>
          </Grid>
        </Grid>
      </Dialog>
    );
  }
}

export const DeckSaveDialog = new DeckSaveDialog_0();
