import { Texture } from "pixi.js";
import { ColorPalette } from "./ColorPalette";
import { GridComponent } from "./GridComponent";
import { Color } from "../engine/Color";
import { Component } from "../engine/Component";
import { SpFireTexture } from "./SpFireTexture";

interface ISpMeterComponentProps {
  turn: Turn;
  value: number;
  name: string;
  spAttack: number;
}

export class SpMeterComponent extends Component<ISpMeterComponentProps> {
  layout = {
    width: 30,
    height: 30,
    padding: 4.5,
    gutter: {
      width: 8,
      height: 68,
      x: -20,
    },
  };

  constructor() {
    super({
      turn: 1,
      value: 0,
      name: "Player",
      spAttack: 0,
    });

    const { width, height, padding, gutter: gutterLayout } = this.layout;

    const y1 = 0,
      y2 = height + padding;

    const root1 = this.addContainer();

    this.addComponent(new GridComponent(), {
      parent: root1,
      y: y1,
    })
      .update({
        tileset: new Map([
          [0, { texture: "pure_black.webp", alpha: 0.7 }],
          [1, { texture: "pure_black.webp", alpha: 0.6 }],
          [2, { texture: "pure_black.webp", alpha: 0.4 }],
          [3, { texture: "pure_black.webp", alpha: 0.2 }],
        ]),
        matrix: {
          values: [0, 1, 2, 3],
          size: [4, 1],
        },
        transform: {
          dx: width + padding,
          scale: width / 40,
        },
      })
      .lock();

    const grid = this.addComponent(new GridComponent(), {
      parent: root1,
      y: y1,
    }).update({
      tileset: new Map([
        [1, "player1_special_space.webp"],
        [-1, "player2_special_space.webp"],
      ]),
      transform: {
        dx: width + padding,
        scale: width / 40,
      },
    });

    const spGrid = this.addComponent(new GridComponent(), {
      parent: root1,
      x: width / 2,
      y: y1 + 3,
    }).update({
      tileset: new Map([
        [1, SpFireTexture.P1],
        [-1, SpFireTexture.P2],
      ]),
      transform: {
        anchor: 0.5,
        dx: width + padding,
        scale: width / 40,
      },
    });

    const root2 = this.addContainer({ y: y2 });
    const dxy = 3;
    const text1 = this.addText({
      parent: root2,
      x: dxy,
      y: dxy,
      alpha: 0.7,
      style: {
        fill: Color.BLACK.i32,
        fontFamily: "Splatoon1",
        fontSize: width,
      },
    });
    const text = this.addText({
      parent: root2,
      style: {
        fill: Color.WHITE.i32,
        fontFamily: "Splatoon1",
        fontSize: width,
      },
    });

    const gutter = this.addSprite({
      x: gutterLayout.x,
      width: gutterLayout.width,
      height: gutterLayout.height,
      texture: Texture.WHITE,
    });

    const fn = () => {
      const turn = this.props.turn.value;
      const value = this.props.value.value;
      const spAttack = this.props.spAttack.value;
      grid.update({
        matrix: { values: Array(value).fill(turn), size: [100, 1] },
      });
      spGrid.update({
        matrix: { values: Array(spAttack).fill(turn), size: [100, 1] },
      });
      if (turn > 0) {
        gutter.tint = ColorPalette.Player1.primary.i32;
        root1.y = y1;
        root2.y = y2;
      } else {
        gutter.tint = ColorPalette.Player2.primary.i32;
        root1.y = y2 + 3;
        root2.y = y1 - 7;
      }
    };
    this.props.turn.onUpdate(fn);
    this.props.value.onUpdate(fn);
    this.props.spAttack.onUpdate(fn);
    this.props.name.onUpdate((v) => (text1.text = text.text = v));
  }

  async uiUpdate(value: number): Promise<any> {
    this.update({ value });
    // for (let i = 0; i < count; ++i) {
    //   this.spaces[i].update({ value: this.turn * Spaces.SPECIAL });
    //   // .uiUpdate(this.turn * Spaces.SPECIAL);
    // }
  }
}
