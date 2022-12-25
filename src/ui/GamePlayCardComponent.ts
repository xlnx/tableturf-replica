import { CardComponent } from "./CardComponent";
import { Color } from "../engine/Color";
import { Component } from "../engine/Component";
import { EaseFunc } from "../engine/animations/Ease";
import { Camera3d, Container3d } from "pixi-projection";
import { Container } from "pixi.js";

interface ICardAnimationProps {
  card: ICard | null;
  turn: ITurn;
}

export class GamePlayCardComponent extends Component<ICardAnimationProps> {
  layout = {
    width: 344,
    height: 480,
    radius: 32,
    dxy: 3,
  };

  private readonly cardRoot: Container3d;

  private readonly toggleSleeve: (ok: boolean) => void;
  private readonly overlayRoot: Container;

  constructor() {
    super({
      card: null,
      turn: 1,
    });

    const { width: w, height: h, radius: r, dxy } = this.layout;
    const root = this.addContainer({ x: w / 2, y: h / 2 });

    const bgRoot = this.addContainer({ parent: root });
    const w1 = w - 2 * dxy;
    const h1 = h - 2 * dxy;
    const r1 = r - dxy;
    this.addGraphics({ parent: bgRoot })
      .beginFill(0x888888)
      .drawRoundedRect(-w / 2, -h / 2, w, h, r)
      .beginHole()
      .drawRoundedRect(-w1 / 2, -h1 / 2, w1, h1, r1);

    const e = this.addGraphics({ parent: bgRoot })
      .beginFill(Color.BLACK.i32)
      .drawRoundedRect(-w1 / 2, -h1 / 2, w1, h1, r1);
    e.alpha = 0.7;
    this.lock(bgRoot);

    const arrow = this.addSprite({
      parent: root,
      anchor: 0.5,
      tint: Color.fromHex(0x333355),
      texture: "IconUp_00.webp",
    });

    const camera = new Camera3d();
    camera.setPlanes(1000, 10, 10000);
    root.addChild(camera);

    this.cardRoot = new Container3d();
    camera.addChild(this.cardRoot);

    const sleeve = this.addSprite({
      parent: this.cardRoot,
      anchor: 0.5,
      width: w,
      height: h,
      scale: 0,
      texture: "MngCardSleeve_Default.webp",
    });
    sleeve.convertSubtreeTo3d();

    const cardRoot = this.addContainer({ parent: this.cardRoot });

    const card = this.addComponent(new CardComponent(), {
      parent: cardRoot,
      anchor: 0.5,
    });
    card.interactions.on.update(false);

    this.overlayRoot = this.addContainer({ parent: cardRoot });
    this.overlayRoot.visible = false;

    const overlay = this.addGraphics({ parent: this.overlayRoot })
      .beginFill(Color.fromHex(0x5f5f5f).i32)
      .drawRoundedRect(-w / 2, -h / 2, w, h, r);
    overlay.alpha = 0.6;

    this.addText({
      parent: this.overlayRoot,
      anchor: 0.5,
      text: "Pass",
      style: {
        fill: Color.WHITE.i32,
        fontFamily: "Splatoon1",
        fontSize: 60,
      },
    });

    cardRoot.convertSubtreeTo3d();

    this.toggleSleeve = (ok: boolean) => {
      cardRoot.scale.set(ok ? 0 : 1);
      sleeve.scale.set(ok ? 1 : 0);
    };

    const fn = () => {
      const v = this.props.card.value;
      const turn = this.props.turn.value;
      if (v == null) {
        cardRoot.visible = false;
        return;
      }
      cardRoot.visible = true;
      card.update({ card: v, turn });
    };
    this.props.card.onUpdate(fn);
    this.props.turn.onUpdate(fn);

    let t0 = 0;
    const fn1 = (t: number) => {
      const dt = t - t0;
      t0 = t;
      arrow.angle += (180 * dt) / 1000;
      window.requestAnimationFrame(fn1);
    };
    window.requestAnimationFrame(fn1);
  }

  async uiSelectCard(card: ICard) {
    this.toggleSleeve(true);
    this.update({ card });
    const a = this.addAnimation((t) => {
      const e = EaseFunc.EASE_OUT_BACK.apply(t);
      this.cardRoot.x = 0;
      this.cardRoot.y = EaseFunc.LINEAR.interpolate(100, 0, e);
      this.cardRoot.alpha = EaseFunc.LINEAR.interpolate(0, 1, t);
    });
    await a.play(0.4);
  }

  async uiShowCard(card: ICard, discard: boolean) {
    this.update({ card });

    const a1 = this.addAnimation((t) => {
      this.cardRoot.euler.y = (Math.PI / 2) * t;
    });
    const a2 = this.addAnimation((t) => {
      this.cardRoot.euler.y = (-Math.PI / 2) * (1 - t);
    });

    const dt = 0.1;
    this.cardRoot.position.set(0);
    this.cardRoot.alpha = 1;
    this.toggleSleeve(true);
    await a1.play(dt);
    this.overlayRoot.visible = discard;
    this.toggleSleeve(false);
    await a2.play(dt);
  }

  async uiHideCard() {
    this.toggleSleeve(false);
    const a = this.addAnimation((t) => {
      const e = t;
      this.cardRoot.x = EaseFunc.LINEAR.interpolate(0, 50, e);
      this.cardRoot.y = 0;
      this.cardRoot.alpha = EaseFunc.LINEAR.interpolate(1, 0, t);
    });
    await a.play(0.4);
    this.overlayRoot.visible = false;
    this.cardRoot.position.set(0);
    this.cardRoot.alpha = 1;
    this.update({ card: null });
  }
}
