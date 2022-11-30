import { CardComponent } from "./CardComponent";
import { SmallCardComponent } from "./SmallCardComponent";
import { ItemListComponent } from "./ItemListComponent";
import { Color } from "../engine/Color";
import { Window } from "../engine/Window";
import { getCardById } from "../core/Tableturf";
import { TryOutWindow } from "./TryOutWindow";
import { Lobby } from "../Lobby";
import { MessageBar } from "./MessageBar";
import { DB } from "../Database";
import { ReactNode } from "react";
import { ThemeProvider } from "@mui/material";
import { Theme, BasicButton } from "./Theme";

class DeckEditWindow_0 extends Window {
  private readonly cardIdMap = new Map<number, CardComponent>();
  private readonly cards: SmallCardComponent[] = [];
  private readonly deckView: ItemListComponent<SmallCardComponent>;

  layout = {
    width: 1920,
    height: 1080,
  };

  constructor() {
    super({
      bgTint: Color.fromHex(0x333333),
    });

    for (let i = 0; i < 15; ++i) {
      const card = new SmallCardComponent().update({ card: getCardById(1) });
      card.interactions.onTap(() => {
        const items = this.deckView.props.items.value.slice();
        const idx = items.findIndex((e) => e == card);
        console.assert(idx != -1);
        items.splice(idx, 1);
        const { id } = card.props.card.value;
        this.cardIdMap.get(id).interactions.disabled.update(false);
        this.deckView.update({ items });
      });
      this.cards.push(card);
    }

    // init card collection
    for (let i = 1; i <= 162; ++i) {
      const card = new CardComponent();
      card.update({ card: getCardById(i) });
      card.interactions.onTap(() => {
        const items = this.deckView.props.items.value.slice();
        if (items.length >= 15) {
          MessageBar.warning("your deck is full.");
          return;
        }
        const { id } = card.props.card.value;
        const idx = items.findIndex((card) => card.props.card.value.id == id);
        console.assert(idx == -1);
        for (const card of this.cards) {
          if (!items.includes(card)) {
            card.update({ card: getCardById(id) });
            items.push(card);
            this.deckView.update({ items });
            this.cardIdMap.get(id).interactions.disabled.update(true);
            return;
          }
        }
        console.assert(false);
      });
      this.cardIdMap.set(i, card);
    }

    // init collection view
    this.addComponent(
      new ItemListComponent({
        width: 1460,
        height: 1080,
      })
    ).update({
      items: Array.from(this.cardIdMap.values()),
      layout: {
        xlimit: 7,
        padding: {
          x: 20,
        },
        anchor: {
          x: 0.5,
        },
      },
    });

    // init deck view
    this.deckView = this.addComponent(
      new ItemListComponent<SmallCardComponent>({
        width: 460,
        height: 1080,
      }),
      {
        x: 1460,
      }
    ).update({
      bg: {
        color: Color.fromHex(0x101010),
        alpha: 1,
      },
      layout: {
        xlimit: 3,
        padding: {
          x: 10,
        },
        anchor: {
          x: 0.5,
        },
      },
    });

    this.uiReset(DB.player.deck.slice());
  }

  protected renderReact(): ReactNode {
    const getDeck = () => {
      return this.deckView.props.items.value.map((e) => e.props.card.value.id);
    };
    return (
      <ThemeProvider theme={Theme}>
        <BasicButton
          sx={{
            position: "absolute",
            left: 1480,
            top: 980,
            width: 200,
            height: 80,
          }}
          onClick={() => {
            TryOutWindow.panel.update({ deck: getDeck() });
            TryOutWindow.panel.reset();
            Lobby.togglePixiWindow(TryOutWindow);
          }}
        >
          Test Deck
        </BasicButton>
        <BasicButton
          sx={{
            position: "absolute",
            left: 1700,
            top: 980,
            width: 200,
            height: 80,
          }}
          onClick={() => {
            const deck = getDeck();
            if (deck.length < 15) {
              MessageBar.error(`deck not full: [${deck.length} < 15]`);
              return;
            }
            Lobby.updatePlayerInfo({ deck });
            MessageBar.success(`your deck has been updated.`);
          }}
        >
          Ok!
        </BasicButton>
      </ThemeProvider>
    );
  }

  uiReset(deck: number[]) {
    this.cardIdMap.forEach((card, id) => {
      card.interactions.disabled.update(deck.includes(id));
    });
    this.deckView.update({
      items: deck.map((id, i) =>
        this.cards[i].update({ card: getCardById(id) })
      ),
    });
  }
}

export const DeckEditWindow = new DeckEditWindow_0();
