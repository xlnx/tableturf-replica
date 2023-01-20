export class EventDispatcher<Event extends string> {
  private readonly eventHandlers: { [_: string]: any } = {};

  protected dispatchEvent(event: Event, ...args: any[]) {
    const handlers = this.eventHandlers[event] || [];
    for (const handler of handlers) {
      try {
        handler(...args);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  protected registerEventHandler(event: Event, handler: () => any) {
    if (!(event in this.eventHandlers)) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
    return () => {
      const handlers = this.eventHandlers[event];
      const idx = handlers.indexOf(handler);
      if (idx >= 0) {
        handlers.splice(idx, 1);
      }
    };
  }
}
