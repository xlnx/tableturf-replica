import { EventDispatcher } from "../game/EventDispatcher";

interface Slot {
  promise: Promise<any>;
  resolve: any;
  reject: any;
}

/**
 * @deprecated may drop request
 */
export class Awaiter extends EventDispatcher<string> {
  private readonly slots = new Map<string, Slot[]>();

  /**
   * @deprecated may drop request
   */
  receive(topic: string): Promise<any> {
    let resolve, reject;
    const promise = new Promise((x, y) => {
      resolve = x;
      reject = y;
    });
    const pipe = {
      promise,
      resolve,
      reject,
    };
    if (this.slots.has(topic)) {
      this.slots.get(topic).push(pipe);
    } else {
      this.slots.set(topic, [pipe]);
    }
    return promise;
  }

  /**
   * @deprecated may drop request
   */
  send(topic: string, value?: any): boolean {
    if (!this.slots.has(topic)) {
      return false;
    }
    this.slots.get(topic).forEach(({ resolve }) => resolve(value));
    this.slots.delete(topic);
    return true;
  }
}
