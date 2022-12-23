import { CardGridComponent } from "./CardGridComponent";
import { Component } from "../engine/Component";
import { Color } from "../engine/Color";
import { GridComponent } from "./GridComponent";
import { System } from "../engine/System";
import { CardInteractions } from "./CardInteractions";
import { SpFireTexture } from "./SpFireTexture";
import { Card, getCardById } from "../core/Tableturf";

interface ISmallCardComponentProps {
  card: Card;
  spFire: boolean;
}

export class SmallCardComponent extends Component<ISmallCardComponentProps> {
  readonly interactions: CardInteractions;

  layout = {
    width: 153 * 2,
    height: 196 * 2,
    radius: 7 * 2,
    padding: 9 * 2,
    boardScale: 0.934,
    bgColor: 0x4f5055,
    szMeter: {
      margin: 6 * 2,
      radius: 11 * 2,
      width: 48 * 2,
      height: 44 * 2,
    },
    spMeter: {
      x: 58 * 2,
      y: 153 * 2,
      width: 13 * 2,
      padding: 1.5 * 2,
    },
  };

  constructor() {
    super({
      card: getCardById(1),
      spFire: false,
    });

    const {
      width,
      height,
      radius,
      padding,
      boardScale,
      bgColor,
      spMeter: spMeterLayout,
      szMeter: szMeterLayout,
    } = this.layout;

    const root = this.addContainer();

    const cardRoot = this.addContainer({ parent: root });

    const bg = this.addGraphics({ parent: cardRoot })
      .beginFill(bgColor)
      .drawRoundedRect(0, 0, width, height, radius);

    const img = this.addSprite({
      parent: cardRoot,
      x: 0,
      y: padding,
      width,
      height,
      tint: Color.fromHex(0xafafaf),
    });

    const grid = this.addComponent(new CardGridComponent(), {
      parent: cardRoot,
      x: padding,
      y: padding,
      scale: { width: width - 2 * padding, height: width - 2 * padding },
    });
    grid.update({ flat: true });
    grid.scale.y = boardScale;

    this.addGraphics({ parent: cardRoot })
      .beginFill(Color.BLACK.i32)
      .drawRoundedRect(
        szMeterLayout.margin,
        height - szMeterLayout.margin - szMeterLayout.height,
        szMeterLayout.width,
        szMeterLayout.height,
        szMeterLayout.radius
      );

    const szMeter = this.addText({
      parent: cardRoot,
      anchor: 0.5,
      x: szMeterLayout.margin + szMeterLayout.width / 2,
      y: height - szMeterLayout.margin - szMeterLayout.height / 2,
      style: {
        fill: 0xeeeeee,
        fontFamily: "Splatoon1",
        fontSize: szMeterLayout.height * 0.7,
      },
    });

    const spMeterRoot = this.addContainer({
      parent: root,
      x: spMeterLayout.x + 20,
      y: spMeterLayout.y + 20,
    });
    const sxy = spMeterLayout.width / 40;
    spMeterRoot.scale.set(sxy);
    const dx = 40 + spMeterLayout.padding / sxy;
    const spMeter = this.addComponent(new GridComponent(), {
      parent: spMeterRoot,
    });
    spMeter.update({
      tileset: new Map([[1, "pure_orange.webp"]]),
      transform: {
        anchor: 0.5,
        dx,
        dy: dx,
      },
    });

    const tiles1 = new Map();
    const tiles2 = new Map([[1, SpFireTexture.P1]]);
    const spFireGrid = this.addComponent(new GridComponent(), {
      parent: spMeterRoot,
      y: -16,
    }).update({
      tileset: tiles1,
      transform: {
        anchor: 0.5,
        dx,
        dy: dx,
      },
    });

    this.props.card.onUpdate((card) => {
      if (card == null) {
        return;
      }
      img.texture = System.texture(card.render.bg);
      grid.update({ card });
      szMeter.text = `${card.count.area}`;
      const matrix = {
        values: Array(card.count.special).fill(1),
        size: [5, 2],
      };
      spMeter.update({ matrix });
      spFireGrid.update({ matrix });

      this.lock(cardRoot);
      spMeter.lock();
    });
    this.props.spFire.onUpdate((ok) => {
      spFireGrid.update({ tileset: ok ? tiles2 : tiles1 });
    });

    this.interactions = CardInteractions.install(this, { radius });
  }
}
