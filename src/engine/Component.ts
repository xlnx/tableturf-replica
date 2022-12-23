import {
  Container,
  DisplayObject,
  Filter,
  Graphics,
  ObservablePoint,
  Sprite,
  Text,
  ITextStyle,
  Texture,
  Rectangle,
} from "pixi.js";
import { Cell } from "./Cell";
import {
  Animation,
  IAnimationOptions,
  KeyFrameFuncType,
} from "./animations/Animation";
import { Color } from "./Color";
import VertexGlsl from "./Vertex.glsl?raw";
import FragmentGlsl from "./Fragment.glsl?raw";
import { System } from "../engine/System";
import { EventHandler } from "./events/EventHandler";
import { Awaiter } from "./Awaiter";

interface IDisplayObjectOptions {
  parent?: Container;
  x?: number;
  y?: number;
  angle?: number;
  filters?: Filter[];
  zIndex?: number;
}

interface ISpriteOptions extends IDisplayObjectOptions {
  width?: number;
  height?: number;
  texture?: Texture | string;
  tint?: Color;
  alpha?: number;
  scale?:
    | {
        x: number;
        y?: number;
      }
    | number;
  anchor?:
    | {
        x: number;
        y?: number;
      }
    | number;
}

interface ITextOptions extends ISpriteOptions {
  text?: string;
  style?: Partial<ITextStyle>;
}

interface IComponentOptions {
  parent?: Container;
  x?: number;
  y?: number;
  scale?: {
    width: number;
    height: number;
  };
  anchor?:
    | {
        x: number;
        y?: number;
      }
    | number;
}

interface IShadowOptions {
  x: number;
  y: number;
  alpha: number;
}

interface EventController {
  toggle(ok: boolean): void;
}

export class Shader extends Filter {
  private static readonly INSTANCES: Shader[] = [];

  static from(frag: string, uniforms?: any) {
    if (!uniforms) {
      uniforms = {};
    }
    Object.assign(uniforms, {
      iTime: 0,
    });
    const shader = new Shader(VertexGlsl, FragmentGlsl + frag, uniforms);
    Shader.INSTANCES.push(shader);
    return shader;
  }

  private static t0 = performance.now();

  static time(t?: number) {
    t = t || performance.now();
    return (t - this.t0) / 1000;
  }

  static readonly BLACK = Shader.from(`
    void main() {
      float a = texture2D(uSampler, vTextureCoord).a;
      gl_FragColor = vec4(vec3(0.0), a);
    }
  `);

  static {
    const fn = (t: number) => {
      t = this.time(t);
      Shader.INSTANCES.forEach((shader) => (shader.uniforms.iTime = t));
      window.requestAnimationFrame(fn);
    };
    window.requestAnimationFrame(fn);
  }
}

export class Component<IProps extends {} = {}> extends Awaiter {
  public readonly anchor = new ObservablePoint(this.onUpdateAnchor, this);
  public readonly ui = new Container();

  private readonly ui1 = new Container();
  private readonly ui2 = new Container();

  private readonly evts = new Map<EventType, EventHandler[]>();

  public layout: {
    width: number;
    height: number;
  };

  public readonly props: { [P in keyof IProps]: Cell<IProps[P]> } = <any>{};

  constructor(props: IProps = <any>{}) {
    super();
    this.ui.addChild(this.ui1);
    this.ui1.addChild(this.ui2);
    (<any>this.ui2)._component = this;

    for (const key in props) {
      const cell = Cell.of(props[key]);
      this.props[key] = cell;
      setTimeout(() => cell.update(cell.value), 0);
    }

    setTimeout(() => {
      this.ui2.hitArea = new Rectangle(
        0,
        0,
        this.layout.width,
        this.layout.height
      );
    }, 0);
  }

  update(newProps: { [P in keyof IProps]?: IProps[P] }): this {
    for (const key in newProps) {
      const prop = this.props[key];
      if (prop != null) {
        const v = newProps[key];
        prop.update(v);
      }
    }
    return this;
  }

  addShader(frag: string, uniforms?: any): Filter {
    return Shader.from(frag, uniforms);
  }

  addAnimation(options?: IAnimationOptions | KeyFrameFuncType): Animation {
    return new Animation(options || {});
  }

  addChild(e: Component | DisplayObject) {
    if (e instanceof Component) {
      this.ui2.addChild(e.ui);
    } else {
      this.ui2.addChild(e);
    }
  }

  addContainer(options?: IDisplayObjectOptions): Container {
    const obj = new Container();
    this.doAddDisplayObject(obj, options);
    return obj;
  }

  addGraphics(options?: IDisplayObjectOptions): Graphics {
    const obj = new Graphics();
    this.doAddDisplayObject(obj, options);
    return obj;
  }

  addSprite(options?: ISpriteOptions): Sprite {
    const obj = new Sprite();
    this.doAddSprite(obj, options);
    return obj;
  }

  addText(options: ITextOptions): Text {
    const obj = new Text();
    const { text, style } = options || {};
    if (style != null) {
      obj.style = style;
    }
    if (text != null) {
      obj.text = text;
    }
    this.doAddSprite(obj, options);
    return obj;
  }

  addComponent<U extends Component>(obj: U, options?: IComponentOptions): U {
    const { parent, x, y, scale, anchor } = options || {};
    obj.position.set(x || 0, y || 0);
    if (scale != null) {
      obj.scaleToFit(scale.width, scale.height);
    }
    if (anchor != null) {
      if (typeof anchor == "number") {
        obj.anchor.set(anchor);
      } else {
        obj.anchor.set(anchor.x, anchor.y);
      }
    }
    (parent || this.ui2).addChild(obj.ui);
    return obj;
  }

  // TODO: support cancel handlers
  handle(cls: { new (sender: Component): EventHandler }): EventController {
    const evt = new cls(this);
    let li = this.evts.get(evt.type);
    if (li == null) {
      li = [];
      this.evts.set(evt.type, li);
    }
    li.push(evt);
    this.ui2.interactive = true;
    return {
      toggle(ok: boolean) {
        evt.allowFire = ok;
      },
    };
  }

  getHandlers(et: EventType): EventHandler[] {
    let li = this.evts.get(et);
    if (li != null) {
      return li.slice();
    }
    return [];
  }

  castShadow(obj: DisplayObject | Component, options: IShadowOptions) {}

  private doAddSprite(obj: Sprite, options?: ISpriteOptions) {
    const { width, height, texture, anchor, tint, scale, alpha } =
      options || {};
    if (width != null) {
      obj.width = width;
    }
    if (height != null) {
      obj.height = height;
    }
    if (scale != null) {
      if (typeof scale == "number") {
        obj.scale.set(scale);
      } else {
        obj.scale.set(scale.x, scale.y);
      }
    }
    if (anchor != null) {
      if (typeof anchor == "number") {
        obj.anchor.set(anchor);
      } else {
        obj.anchor.set(anchor.x, anchor.y);
      }
    }
    if (texture != null) {
      if (typeof texture == "string") {
        obj.texture = System.texture(texture);
      } else {
        obj.texture = texture;
      }
    }
    if (alpha != null) {
      obj.alpha = alpha;
    }
    if (tint != null) {
      obj.tint = tint.i32;
    }
    this.doAddDisplayObject(obj, options);
  }

  private doAddDisplayObject(
    obj: DisplayObject,
    options?: IDisplayObjectOptions
  ) {
    const { parent, x, y, angle, filters, zIndex } = options || {};
    obj.position.set(x || 0, y || 0);
    if (angle != null) {
      obj.angle = angle;
    }
    if (filters != null) {
      obj.filters = filters.slice();
    }
    if (zIndex != null) {
      obj.zIndex = zIndex;
    }
    (parent || this.ui2).addChild(obj);
  }

  scaleToFit(width: number, height?: number) {
    height = height || width;
    const scale = Math.min(
      width / this.layout.width,
      height / this.layout.height
    );
    this.ui1.scale.set(scale);
  }

  lock(obj?: DisplayObject) {
    this.unlock(obj);
    obj = obj || this.ui2;
    obj.cacheAsBitmap = true;
  }

  unlock(obj?: DisplayObject) {
    obj = obj || this.ui2;
    obj.cacheAsBitmap = false;
  }

  get position() {
    return this.ui.position;
  }

  get scale() {
    return this.ui.scale;
  }

  get angle() {
    return this.ui.angle;
  }

  set angle(value: number) {
    this.ui.angle = value;
  }

  get visible() {
    return this.ui.visible;
  }

  set visible(value: boolean) {
    this.ui.visible = value;
  }

  private onUpdateAnchor() {
    this.ui2.position.set(
      -this.anchor.x * this.layout.width,
      -this.anchor.y * this.layout.height
    );
  }
}
