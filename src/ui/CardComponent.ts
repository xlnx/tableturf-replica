import { CardGridComponent } from "./CardGridComponent";
import { GridComponent } from "./GridComponent";
import { CardInteractions } from "./CardInteractions";
import { Color } from "../engine/Color";
import { Component } from "../engine/Component";
import { getCardById } from "../core/Tableturf";
import { System } from "../engine/System";
import { I18n } from "../i18n/I18n";

interface ICardComponentProps {
  card: ICard;
  turn: ITurn;
}

export class CardComponent extends Component<ICardComponentProps> {
  readonly interactions: CardInteractions;

  layout = {
    width: 344,
    height: 480,
    bg: {
      width: 330,
      height: 462,
    },
    frame: {
      width: 308,
      height: 445,
      radius: 15,
      dxy: 10,
    },
    ink: {
      width: 344,
      height: 480,
    },
    cardName: {
      x: 0,
      y: -166,
    },
    szMeter: {
      x: -124,
      y: 192,
    },
    spMeter: {
      x: -71,
      y: 205,
      dx: 48,
      dy: -55,
      width: 42,
    },
    grid: {
      x: 88,
      y: 155,
      width: 320,
      height: 320,
    },
  };

  constructor() {
    super({
      card: getCardById(1),
      turn: 1,
    });

    const { width, height } = this.layout;

    const root = this.addContainer({
      x: width / 2,
      y: height / 2,
    });

    const cardRoot = this.addContainer({ parent: root });

    const bg = this.addSprite({
      parent: cardRoot,
      anchor: 0.5,
      width: this.layout.bg.width,
      height: this.layout.bg.height,
    });

    this.addSprite({
      parent: cardRoot,
      anchor: 0.5,
      width: this.layout.ink.width,
      height: this.layout.ink.height,
      tint: Color.fromHex(0xd8d8d8),
      texture: "Ink_03.webp",
    });

    // TODO: until pixi-projection support graphics
    // const w = this.layout.frame.width;
    // const h = this.layout.frame.height;
    // const r = this.layout.frame.radius;
    // const w1 = w + this.layout.frame.dxy * 2;
    // const h1 = h + this.layout.frame.dxy * 2;
    // const r1 = r + this.layout.frame.dxy;
    // const frame = this.addGraphics({
    //   parent: cardRoot,
    // })
    //   .beginFill(Color.BLACK.i32)
    //   .drawRoundedRect(-w1 / 2, -h1 / 2, w1, h1, r1)
    //   .beginHole()
    //   .drawRoundedRect(-w / 2, -h / 2, w, h, r);

    const img = this.addSprite({
      parent: cardRoot,
      anchor: 0.5,
      width,
      height,
    });

    const cardName1 = this.addText({
      parent: cardRoot,
      anchor: 0.5,
      x: this.layout.cardName.x,
      y: this.layout.cardName.y,
      style: {
        fill: Color.BLACK.i32,
        fontFamily: "Splatoon1",
        fontSize: 32,
        strokeThickness: 8,
      },
    });
    const cardName = this.addText({
      parent: cardRoot,
      anchor: 0.5,
      x: this.layout.cardName.x,
      y: this.layout.cardName.y,
      style: {
        fill: Color.WHITE.i32,
        fontFamily: "Splatoon1",
        fontSize: 32,
      },
    });

    const base = this.addSprite({
      parent: cardRoot,
      anchor: 0.5,
      y: 192,
      width: 324,
      height: 86,
      texture: "CardFrame_01.webp",
    });

    const frame = this.addSprite({
      parent: cardRoot,
      anchor: 0.5,
      width,
      height,
      texture: "CardFrame_00.webp",
    });

    const szMeterRoot = this.addContainer({
      parent: cardRoot,
      x: this.layout.szMeter.x,
      y: this.layout.szMeter.y,
    });
    const szMeterBg = this.addSprite({
      parent: szMeterRoot,
      anchor: 0.5,
      width: 64,
      height: 64,
      angle: 45,
    });
    const szMeter1 = this.addText({
      parent: szMeterRoot,
      anchor: 0.5,
      x: 1,
      y: -2,
      style: {
        fill: Color.BLACK.i32,
        fontFamily: "Splatoon1",
        fontSize: 28,
        strokeThickness: 5,
      },
    });
    const szMeter = this.addText({
      parent: szMeterRoot,
      anchor: 0.5,
      x: 1,
      y: -2,
      style: {
        fill: Color.WHITE.i32,
        fontFamily: "Splatoon1",
        fontSize: 28,
      },
    });

    const spMeterRoot = this.addContainer({
      parent: cardRoot,
      x: this.layout.spMeter.x,
      y: this.layout.spMeter.y,
    });
    spMeterRoot.scale.set(0.4);
    const spMeter = this.addComponent(new GridComponent(), {
      parent: spMeterRoot,
    });
    spMeter.update({
      tileset: new Map([
        [1, "player1_special_space.webp"],
        [-1, "player2_special_space.webp"],
      ]),
      transform: {
        anchor: 0.5,
        dx: this.layout.spMeter.dx,
        dy: this.layout.spMeter.dy,
      },
    });

    const grid = this.addComponent(new CardGridComponent(), {
      parent: cardRoot,
      anchor: 0.5,
      x: this.layout.grid.x,
      y: this.layout.grid.y,
      scale: {
        width: this.layout.grid.width * 0.38,
        height: this.layout.grid.width * 0.38,
      },
    });
    grid.angle = 7;
    grid.update({ flat: false });

    const fn = () => {
      const turn = this.props.turn.value;
      const card = this.props.card.value;

      if (card == null) {
        return;
      }

      const { name, rarity, count, render } = card;

      cardName1.text = cardName.text = I18n.localize(
        "CommonMsg/MiniGame/MiniGameCardName",
        name
      );

      img.texture = System.texture(render.bg);

      grid.update({ card, turn });

      const l0 = { Common: "Cmn", Rare: "Rre", Fresh: "Frh" }[rarity];
      bg.texture = System.texture(`MngCardBG_${l0}_00.webp`);

      const l1 = ["Common", "Rare", "Fresh"].indexOf(rarity);
      szMeterBg.texture = System.texture(`CardCost_0${l1}.webp`);
      spMeter.update({
        matrix: {
          size: [5, 2],
          values: Array(count.special).fill(turn),
        },
      });

      szMeter1.text = szMeter.text = `${count.area}`;

      this.lock(cardRoot);
    };

    this.props.card.onUpdate(fn);
    this.props.turn.onUpdate(fn);

    this.interactions = CardInteractions.install(this, { radius: 30 });
  }
}
