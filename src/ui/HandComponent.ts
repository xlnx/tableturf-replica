import { Color } from "../engine/Color";
import { SmallCardComponent } from "./SmallCardComponent";
import { Component } from "../engine/Component";
import { EaseFunc } from "../engine/animations/Ease";
import { getCardById } from "../core/Tableturf";

interface IHandComponentProps {
  cards: ICard[];
}

export class HandComponent extends Component<IHandComponentProps> {
  private selectCardId: number = -1;
  private selectCardCallBack: any;
  private readonly cards: SmallCardComponent[];

  layout = {
    width: 358,
    height: 436,
    radius: 10,
    card: {
      width: 153,
      height: 196,
    },
  };

  constructor() {
    super({
      cards: Array(4).fill(getCardById(1)),
    });

    const rect = this.addGraphics()
      .beginFill(Color.BLACK.i32)
      .drawRoundedRect(
        0,
        0,
        this.layout.width,
        this.layout.height,
        this.layout.radius
      );
    rect.alpha = 0.18;

    const paddingX = (this.layout.width - 2 * this.layout.card.width) / 3;
    const paddingY = (this.layout.height - 2 * this.layout.card.height) / 3;
    this.cards = [];
    for (let y = 0; y < 2; ++y) {
      for (let x = 0; x < 2; ++x) {
        const idx = x + y * 2;
        const cardRoot = this.addContainer({
          x: (x + 0.5) * this.layout.card.width + (x + 1) * paddingX,
          y: (y + 0.5) * this.layout.card.height + (y + 1) * paddingY,
        });
        const card = this.addComponent(new SmallCardComponent(), {
          parent: cardRoot,
          anchor: 0.5,
          scale: {
            width: this.layout.card.width,
            height: this.layout.card.height,
          },
        });
        card.interactions.onTap(() => this.uiSelectCard(idx));
        this.cards.push(card);
      }
    }

    this.onSelectCard();

    this.props.cards.onUpdate((v) => {
      console.assert(v.length == 4);
      v.forEach((card, i) => this.cards[i].update({ card }));
    });
  }

  async uiDrawCard(v: ICard, i: number) {
    console.assert(0 <= i && i < 4);

    const li = this.props.cards.value.slice();
    li[i] = v;

    const card = this.cards[i];
    const a1 = this.addAnimation((t) => {
      const e = EaseFunc.EASE_IN_CUBIC.apply(t);
      card.ui.alpha = 1 - e;
      card.ui.scale.set(EaseFunc.LINEAR.interpolate(1, 0.9, e));
      card.position.y = 0;
    });

    const a2 = this.addAnimation((t) => {
      const e = EaseFunc.EASE_OUT_CUBIC.apply(t);
      card.ui.alpha = e;
      card.ui.scale.set(1);
      card.position.y = EaseFunc.LINEAR.interpolate(10, 0, e);
    });

    const dt = 0.3;
    await a1.play(dt);
    this.update({ cards: li });
    await this.addAnimation().play(0.05);
    await a2.play(dt);
  }

  uiSelectCard(idx: number = -1) {
    this.selectCardId = idx;
    this.cards.forEach((card, i) => {
      if (i != idx) {
        card.interactions.selected.update(false);
      } else {
        card.interactions.selected.update(true);
      }
    });
    this.selectCardCallBack(idx);
  }

  uiUpdateFilter(ok?: boolean[]) {
    ok = ok || Array(4).fill(true);
    ok.forEach((ok, i) => {
      this.cards[i].interactions.disabled.update(!ok);
      if (!ok && i == this.selectCardId) {
        this.uiSelectCard();
      }
    });
  }

  uiUpdateSpFire(ok?: boolean[]) {
    ok = ok || Array(4).fill(false);
    ok.forEach((ok, i) => {
      this.cards[i].update({ spFire: ok });
    });
  }

  get selectId() {
    return this.selectCardId;
  }

  onSelectCard(callback?: (cardId: number) => void) {
    this.selectCardCallBack = callback || (() => {});
  }
}
