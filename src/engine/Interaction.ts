import {
  Container,
  DisplayObject,
  InteractionEvent,
  InteractionManager,
  Point,
  Sprite,
} from "pixi.js";
import { Component } from "./Component";
import { EventHandler } from "./events/EventHandler";
import { hitTest } from "./events/Utils";
import { System } from "./System";
import { getLogger } from "loglevel";

const logger = getLogger("interaction");
logger.setLevel("info");

export class Interaction {
  private evts: EventHandler[] = [];

  constructor(
    private readonly root: HTMLElement,
    private readonly mgr: InteractionManager,
    private readonly hitbox: Sprite,
    private readonly world: Container
  ) {
    hitbox.interactive = true;

    let pos = new Point(0, 0);
    const pointermove = () => {
      this.fireEvents(pos, ["pointer"]);
      this.updateEvents({
        drag: (evt) => evt._pointermove(pos),
        pointer: (evt) => evt._pointermove(pos),
      });
    };

    if (!import.meta.env.DEV) {
      if (!System.isMobile) {
        // only for cursor on pc
        const fn = () => {
          pointermove();
          window.requestAnimationFrame(fn);
        };
        window.requestAnimationFrame(fn);
      }
    }

    hitbox.on("pointermove", (event: InteractionEvent) => {
      logger.debug("on pointermove");
      pos.copyFrom(event.data.global);
      pointermove();
    });
    hitbox.on("pointerdown", (event: InteractionEvent) => {
      const evt = event.data.originalEvent;
      if (evt instanceof MouseEvent && evt.button != 0) {
        // only left btn is treated as mouse event
        return;
      }
      logger.debug("on pointerdown");
      const pos = event.data.global;
      this.fireEvents(pos, ["drag", "pointer"]);
      this.updateEvents({
        drag: (evt) => evt._pointerdown(pos),
        pointer: (evt) => evt._pointerdown(pos),
      });
    });
    hitbox.on("pointerup", (event: InteractionEvent) => {
      const evt = event.data.originalEvent;
      if (evt instanceof MouseEvent && evt.button != 0) {
        // only left btn is treated as mouse event
        return;
      }
      logger.debug("on pointerup");
      const pos = event.data.global;
      this.updateEvents({
        drag: (evt) => evt._pointerup(pos),
        pointer: (evt) => evt._pointerup(pos),
      });
    });
    hitbox.on("pointerupoutside", (event: InteractionEvent) => {
      const evt = event.data.originalEvent;
      if (evt instanceof MouseEvent && evt.button != 0) {
        // only left btn is treated as mouse event
        return;
      }
      logger.debug("on pointerupoutside");
      const pos = event.data.global;
      this.updateEvents({
        drag: (evt) => evt._pointerup(pos),
        pointer: (evt) => evt._pointerup(pos),
      });
    });

    window.addEventListener("wheel", (event: WheelEvent) => {
      const { clientX, clientY } = event;
      const { x, y } = root.getBoundingClientRect();
      const pos = new Point(clientX - x, clientY - y);
      this.fireEvents(pos, ["wheel"]);
      this.updateEvents({
        wheel: (evt) => evt._wheel(event),
      });
    });
  }

  private hitWorld(pos: Point): Component {
    this.hitbox.interactive = false;
    const e = this.mgr.hitTest(pos, this.world);
    this.hitbox.interactive = true;
    if (e == null) {
      return null;
    }
    const obj = (<any>e)._component;
    if (obj == null) {
      return null;
    }
    if ((<any>obj).ui2 != e) {
      return null;
    }
    return obj;
  }

  private fireEvents(pos: Point, acceptEts: EventType[]) {
    const ets = new Set(acceptEts);
    const ids = new Set<string>();
    const filterEt = (evts: EventHandler[]) => {
      for (const evt of evts) {
        // won't stop this if not overlap
        if (!hitTest(pos, evt.sender)) {
          continue;
        }
        ids.add(evt.id);
        for (const et of evt.stops) {
          ets.delete(et);
          logger.debug(`${evt.name} stops ${et}`);
        }
      }
    };
    filterEt(this.evts);
    if (ets.size == 0) {
      return;
    }

    logger.debug(
      "current events",
      this.evts.map((e) => e.name)
    );
    logger.debug("accept event types", ets);
    const li = [];
    do {
      const obj = this.hitWorld(pos);
      if (obj == null) {
        break;
      }
      logger.debug("hit target", obj);
      const evts: EventHandler[] = [];
      ets.forEach((et) => {
        const li = obj.getHandlers(et);
        // debug.log(obj, et, li);
        for (const evt of li) {
          if (evt.allowFire && !ids.has(evt.id)) {
            evts.push(evt._bootstrap());
          }
        }
      });
      if (evts.length) {
        logger.debug(
          "fire events",
          evts.map((e) => e.name)
        );
        this.evts = this.evts.concat(evts);
        filterEt(evts);
      }
      const e: DisplayObject = (<any>obj).ui2;
      e.interactive = false;
      li.push(e);
    } while (ets.size > 0);

    for (const e of li) {
      e.interactive = true;
    }
  }

  private updateEvents(evts: {
    [K in EventType]?: (e: EventHandler) => EventHandler;
  }) {
    this.evts = this.evts.flatMap((evt) => {
      const fn = evts[evt.type];
      if (fn == null) {
        return [evt];
      }
      const evt1 = fn(evt);
      if (evt1 == null) {
        logger.debug("cancel event", evt.name, evt);
        return [];
      }
      if (evt1 == evt) {
        logger.debug("update event", evt.name, evt);
      } else {
        logger.debug("fire new event", evt.name, evt, "->", evt1);
      }
      return [evt1];
    });
  }
}
