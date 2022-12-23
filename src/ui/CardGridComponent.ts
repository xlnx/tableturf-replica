import { Component } from "../engine/Component";
import { GridComponent } from "./GridComponent";
import { Card, getCardById, Spaces } from "../core/Tableturf";

interface ICardGridComponentProps {
  card: Card;
  turn: Turn;
  flat: boolean;
}

export class CardGridComponent extends Component<ICardGridComponentProps> {
  layout = {
    width: 8,
    height: 8,
  };

  constructor() {
    super({
      card: getCardById(1),
      turn: 1,
      flat: false,
    });

    const root = this.addContainer();
    root.scale.set(1 / 40);

    const empty = { texture: "empty_space.webp", alpha: 0.7 };
    const nrmTiles = new Map<any, any>([
      [Spaces.EMPTY, empty],
      [Spaces.TRIVIAL, "player1_trivial_space.webp"],
      [Spaces.SPECIAL, "player1_special_space.webp"],
      [-Spaces.TRIVIAL, "player2_trivial_space.webp"],
      [-Spaces.SPECIAL, "player2_special_space.webp"],
    ]);

    const flatTiles = new Map<any, any>([
      [Spaces.EMPTY, empty],
      [Spaces.TRIVIAL, "pure_yellow.webp"],
      [Spaces.SPECIAL, "pure_orange.webp"],
    ]);

    const bg = this.addComponent(new GridComponent(), {
      parent: root,
    });

    const fn = () => {
      const card = this.props.card.value;
      const turn = this.props.turn.value;

      bg.update({
        matrix: { ...card, values: card.values.map((x) => x * turn) },
      });
    };
    this.props.card.onUpdate(fn);
    this.props.turn.onUpdate(fn);

    this.props.flat.onUpdate((flat) =>
      bg.update({ tileset: flat ? flatTiles : nrmTiles })
    );
  }
}
