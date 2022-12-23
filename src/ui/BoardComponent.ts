import { Component } from "../engine/Component";
import { GridComponent } from "./GridComponent";
import { Container, Sprite, Texture } from "pixi.js";
import { SpFireTexture } from "./SpFireTexture";
import { OverlayTexture } from "./OverlayTexture";
import { Animation } from "../engine/animations/Animation";
import { EaseFunc } from "../engine/animations/Ease";
import { PointerHandler } from "../engine/events/PointerHandler";
import { TargetAnimation } from "../engine/animations/TargetAnimation";
import { getLocalPos, getWorldPos } from "../engine/events/Utils";
import { System } from "../engine/System";
import { DragHandler } from "../engine/events/DragHandler";
import {
  forEachNonEmpty,
  getCardById,
  getValue,
  isBoardMoveValid,
  isBoardPosCharged,
  moveBoard,
  player2Turn,
  rotateCard,
  Spaces,
} from "../core/Tableturf";
import { WheelHandler } from "../engine/events/WheelHandler";

interface IPlayerInput {
  card: ICard;
  rotation: IRotation;
  pointer: ICoordinate;
  isSpecialAttack: boolean;
}

interface IBoardComponentProps {
  playerId: IPlayerId;
  input: IPlayerInput;
  acceptInput: boolean;
}

type OnUpdateInputFn = (e: ICardPlacement, ok: boolean) => void;
type OnInputFn = (e: ICardPlacement) => void;

export class BoardComponent extends Component<IBoardComponentProps> {
  private readonly root: Container;
  private readonly hitbox: Sprite;
  private readonly bg: GridComponent;
  private readonly spaces: GridComponent;
  private readonly spFire: GridComponent;
  private readonly flash: GridComponent;
  private readonly overlay: GridComponent;

  private readonly nrmOverlay = OverlayTexture.normal();
  private readonly spOverlay = OverlayTexture.special();

  private readonly flashAnimation: Animation;

  private board: IBoardState;
  private lk: boolean = false;
  private selection: number[];

  private onUpdateInputFn: OnUpdateInputFn = () => {};
  private onInputFn: OnInputFn = () => {};

  layout = {
    width: 24,
    height: 27,
    w1: 40,
  };

  constructor() {
    super({
      playerId: 0,
      input: {
        card: null,
        rotation: 0,
        pointer: null,
        isSpecialAttack: false,
      },
      acceptInput: false,
    });

    const self = this;
    const { w1 } = this.layout;

    this.root = this.addContainer();
    this.root.scale.set(1 / w1);

    this.hitbox = this.addSprite({
      parent: this.root,
      x: -w1 / 2,
      y: -w1 / 2,
    });

    this.bg = this.addComponent(new GridComponent(), {
      parent: this.root,
    });
    this.bg.update({
      tileset: new Map<any, any>([
        [Spaces.EMPTY, "empty_space.webp"],
        [Spaces.TRIVIAL, "pure_black.webp"],
        [-Spaces.TRIVIAL, "pure_black.webp"],
        [-Spaces.TRIVIAL, "pure_black.webp"],
        [Spaces.NEUTRAL, "pure_black.webp"],
      ]),
      transform: {
        anchor: 0.5,
      },
    });

    const e1 = { texture: "player1_trivial_space.webp", alpha: 1 };
    const e2 = { texture: "player2_trivial_space.webp", alpha: 1 };
    const spaceTilesets = [
      new Map<any, any>([
        [Spaces.TRIVIAL, e1],
        [Spaces.SPECIAL, "player1_special_space.webp"],
        [-Spaces.TRIVIAL, e2],
        [-Spaces.SPECIAL, "player2_special_space.webp"],
        [Spaces.NEUTRAL, "neutral_space.webp"],
      ]),
      new Map<any, any>([
        [Spaces.TRIVIAL, e2],
        [Spaces.SPECIAL, "player2_special_space.webp"],
        [-Spaces.TRIVIAL, e1],
        [-Spaces.SPECIAL, "player1_special_space.webp"],
        [Spaces.NEUTRAL, "neutral_space.webp"],
      ]),
    ];
    this.spaces = this.addComponent(new GridComponent(), {
      parent: this.root,
    });
    this.spaces.update({
      tileset: spaceTilesets[0],
      transform: {
        anchor: 0.5,
      },
    });

    const tileAlpha = TargetAnimation.of(1)
      .onEase(0.2, EaseFunc.EASE_IN_OUT_EXPO)
      .onUpdate((v) => {
        this.spaces.update({ matrix: this.spaces.props.matrix.value });
        e1.alpha = e2.alpha = v;
      });

    const spFireY = -16;
    const spFireTilesets = [
      new Map([
        [Spaces.SPECIAL, SpFireTexture.P1],
        [-Spaces.SPECIAL, SpFireTexture.P2],
      ]),
      new Map([
        [Spaces.SPECIAL, SpFireTexture.P2],
        [-Spaces.SPECIAL, SpFireTexture.P1],
      ]),
    ];
    this.spFire = this.addComponent(new GridComponent(), {
      parent: this.root,
      y: spFireY,
    });
    this.spFire.update({
      tileset: spFireTilesets[0],
      transform: {
        anchor: 0.5,
        dx: w1,
        dy: w1,
      },
    });

    this.overlay = this.addComponent(new GridComponent(), {
      parent: this.root,
    });
    this.overlay.update({
      tileset: new Map([
        [Spaces.TRIVIAL, this.nrmOverlay.texture],
        [Spaces.SPECIAL, this.spOverlay.texture],
      ]),
      transform: {
        anchor: 0.5,
      },
    });

    this.flash = this.addComponent(new GridComponent(), {
      parent: this.root,
    });
    this.flash.update({
      tileset: new Map([[1, "Decide.webp"]]),
      transform: {
        anchor: 0.5,
        dx: w1,
        dy: w1,
      },
    });

    this.flashAnimation = this.addAnimation({
      time: 0.2,
      keyframe: (t) => {
        // TODO: support grid tint
        // this.flash.tint = e.interpolate(
        //   ColorPalette.Space.flash.secondary,
        //   ColorPalette.Space.flash.primary,
        //   t
        //   ).i32;
        const scale = EaseFunc.LINEAR.interpolate(1, 1.5, t);
        const alpha =
          0.5 * EaseFunc.EASE_IN_OUT_SINE.apply(1 - Math.abs(2 * t - 1));
        this.flash.update({
          transform: { ...this.flash.props.transform.value, scale, alpha },
        });
      },
    });

    const getGridPos = (pos: ICoordinate) => {
      const { x, y } = getLocalPos(pos, self.hitbox);
      const [w, h] = self.board.size;
      return {
        x: Math.min(w - 1, Math.max(0, Math.floor(x * w))),
        y: Math.min(h - 1, Math.max(0, Math.floor(y * h))),
      };
    };

    const sendPlayerInput = async (move: ICardPlacement) => {
      if (move == null) {
        return;
      }
      self.send("player.input", move);
      this.onInputFn(move);
      self.lk = true;
      self.flash.update({
        matrix: {
          ...self.board,
          values: self.selection.map((x) => (x != Spaces.EMPTY ? 1 : 0)),
        },
      });
      await self.flashAnimation.play();
      self.lk = false;
    };

    if (!System.isMobile) {
      this.handle(
        class extends PointerHandler {
          move(pos: ICoordinate): void {
            if (self.lk || !self.board) {
              return;
            }
            if (!self.props.acceptInput.value) {
              return;
            }
            pos = getGridPos(pos);
            self.update({
              input: { ...self.props.input.value, pointer: pos },
            });
          }

          async tap(pos: ICoordinate) {
            if (!self.props.acceptInput.value) {
              return;
            }
            pos = getGridPos(pos);
            if (pos == null) {
              return;
            }
            const move = self.uiUpdateInput({
              ...self.props.input.value,
              pointer: pos,
            });
            await sendPlayerInput(move);
          }
        }
      );
      this.handle(
        class extends WheelHandler {
          wheel(pos: ICoordinate, dy: number): void {
            self.uiRotateInput(dy / 100);
          }
        }
      );
    } else {
      this.handle(
        class extends DragHandler {
          triggerThresholdPx = 8;
          dp: ICoordinate;
          drag(pos: ICoordinate): void {
            if (!self.props.acceptInput.value) {
              return;
            }
            const { x, y } = self.props.input.value.pointer ||
              getGridPos(pos) || { x: 0, y: 0 };
            const [w, h] = self.board.size;
            const wp = getWorldPos(
              { x: (x + 0.5) / w, y: (y + 0.5) / h },
              self.hitbox
            );
            this.dp = {
              x: wp.x - pos.x,
              y: wp.y - pos.y,
            };
            self.update({
              input: { ...self.props.input.value, pointer: { x, y } },
            });
          }
          move(pos: ICoordinate): void {
            if (!self.props.acceptInput.value) {
              return;
            }
            const { x, y } = getGridPos({
              x: this.dp.x + pos.x,
              y: this.dp.y + pos.y,
            });
            self.update({
              input: { ...self.props.input.value, pointer: { x, y } },
            });
          }
          drop(pos: ICoordinate): void {
            if (!self.props.acceptInput.value) {
              return;
            }
            const { x, y } = getGridPos({
              x: this.dp.x + pos.x,
              y: this.dp.y + pos.y,
            });
            // const move = self.uiUpdateInput(
            //   Object.assign({}, self.props.input.value, {
            //     pointer: { x, y },
            //   })
            // );
            self.update({
              input: {
                ...self.props.input.value,
                // pointer: move.position,
                pointer: { x, y },
              },
            });
          }
        }
      );
      this.handle(
        class extends PointerHandler {
          triggerThresholdPx = 5;
          doubleTapThresholdMs = 200;
          async doubleTap(pos: ICoordinate) {
            if (!self.props.acceptInput.value) {
              return;
            }
            const move = self.uiUpdateInput(self.props.input.value);
            await sendPlayerInput(move);
          }
        }
      );
    }

    const fn = () => {
      const input = this.props.input.value;
      const accept = this.props.acceptInput.value;
      if (accept && input) {
        tileAlpha.update(input.isSpecialAttack ? 0.4 : 1);
        this.uiUpdateInput(input);
      } else {
        tileAlpha.update(1);
        this.uiUpdateInput(null);
      }
    };
    this.props.input.onUpdate(fn);
    this.props.acceptInput.onUpdate(fn);
    this.props.playerId.onUpdate((player) => {
      const turn = player2Turn(player);
      this.angle = player * 180;
      this.spFire.position.set(0, turn * spFireY);
      // this.hitbox.position.set(-(w1 / 2) * player);
      for (const ui of [
        this.bg,
        this.spaces,
        this.spFire,
        this.overlay,
        this.flash,
      ]) {
        ui.update({
          transform: { ...ui.props.transform.value, rotate: player * 4 },
        });
      }
      this.spaces.update({ tileset: spaceTilesets[player] });
      this.spFire.update({ tileset: spFireTilesets[player] });
    });
  }

  uiReset(board: IBoardState) {
    this.board = board;
    const [w, h] = this.board.size;
    const x = (this.layout.width - w) / 2;
    const y = (this.layout.height - h) / 2;
    this.root.position.set(x + 0.5, y + 0.5);
    const { w1 } = this.layout;
    this.hitbox.width = w1 * w;
    this.hitbox.height = w1 * h;
    this.spaces.update({ matrix: board });
    this.bg.update({ matrix: board });
    this.bg.lock();
    this.uiUpdateFire();
  }

  uiUpdateFire() {
    const values: number[] = [];
    const [w, h] = this.board.size;
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        const pos = { x, y };
        values.push(
          isBoardPosCharged(this.board, pos) ? getValue(this.board, pos) : 0
        );
      }
    }
    this.spFire.update({
      matrix: { ...this.board, values },
    });
  }

  uiRotateInput(dt: number) {
    if (!this.props.acceptInput.value) {
      return;
    }
    const input = this.props.input.value;
    if (input == null || input.rotation == null) {
      return;
    }
    const rotation = ((((input.rotation + dt) % 4) + 4) % 4) as IRotation;
    this.update({
      input: { ...input, rotation },
    });
  }

  async uiPlaceCards(ms: ICardPlacement[]) {
    this.board = moveBoard(this.board, ms);
    this.spaces.update({ matrix: this.board });
    this.bg.update({ matrix: this.board });
    this.bg.lock();
    const [width, height] = this.board.size;
    const values: number[] = [];
    for (const m of ms) {
      forEachNonEmpty(
        rotateCard(getCardById(m.card), m.rotation),
        ({ x, y }, v) => {
          x += m.position.x;
          y += m.position.y;
          values[x + y * width] = 1;
        }
      );
    }
    this.flash.update({ matrix: { ...this.board, values } });
    await this.flashAnimation.play();
  }

  onUpdateInput(fn: OnUpdateInputFn) {
    this.onUpdateInputFn = fn;
  }

  onInput(fn: OnInputFn) {
    this.onInputFn = fn;
  }

  private uiUpdateInput(input?: IPlayerInput): ICardPlacement {
    this.selection = [];
    if (this.board == null) {
      return null;
    }

    const [width, height] = this.board.size;
    this.overlay.update({
      matrix: { ...this.board, values: this.selection.slice() },
    });
    if (input == null) {
      return null;
    }

    const { card, rotation, pointer, isSpecialAttack } = input;
    if (
      card == null ||
      rotation == null ||
      pointer == null ||
      isSpecialAttack == null
    ) {
      return null;
    }

    const position = this.getAdjustedCardPosition(card, rotation, pointer);
    const move: ICardPlacement = {
      player: this.props.playerId.value,
      card: card.id,
      rotation,
      position,
    };

    const ok = isBoardMoveValid(this.board, move, isSpecialAttack);
    const value = ok ? 1 : 0;
    this.nrmOverlay.update({ value });
    this.spOverlay.update({ value });
    forEachNonEmpty(rotateCard(card, rotation), ({ x, y }, v) => {
      x += position.x;
      y += position.y;
      this.selection[x + width * y] = v;
    });
    this.overlay.update({
      matrix: { ...this.board, values: this.selection.slice() },
    });

    this.onUpdateInputFn(move, ok);

    return move;
  }

  private getAdjustedCardPosition(
    card: ICard,
    rotation: IRotation,
    pointer: ICoordinate
  ): ICoordinate {
    let x = pointer.x - 3;
    let y = pointer.y - 3;

    if (rotation == 1 || rotation == 2) {
      x -= 1;
    }
    if (rotation == 2 || rotation == 3) {
      y -= 1;
    }

    const xs: number[] = [];
    const ys: number[] = [];
    forEachNonEmpty(rotateCard(card, rotation), ({ x: dx, y: dy }, v) => {
      xs.push(x + dx);
      ys.push(y + dy);
    });

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    if (minX < 0) {
      x += -minX;
    }
    if (minY < 0) {
      y += -minY;
    }
    if (maxX >= this.board.size[0]) {
      x -= maxX - this.board.size[0] + 1;
    }
    if (maxY >= this.board.size[1]) {
      y -= maxY - this.board.size[1] + 1;
    }

    return { x, y };
  }
}
