import React from "react";
import { Awaiter } from "./Awaiter";

export abstract class ReactComponent<Props = {}> extends Awaiter {
  private _ctx: any = { state: this.init() };

  private _node: React.ReactNode = (() => {
    const self = this;
    class Outer extends React.Component<{}, Props> {
      state = { ...self._ctx.state };
      Inner = () => <React.Fragment>{self.render()}</React.Fragment>;
      constructor(props) {
        super(props);
        self._ctx = {
          state: this.state,
          getState: () => this.state,
          setState: (e, f) => this.setState(e, f),
        };
      }
      componentDidMount() {
        self.componentDidMount();
      }
      componentDidUpdate(_, prevState: Readonly<Props>) {
        self.componentDidUpdate(prevState);
      }
      render(): React.ReactNode {
        return <this.Inner />;
      }
    }
    return <Outer />;
  })();

  abstract init(): Props;

  abstract render(): React.ReactNode;

  componentDidMount() {}

  componentDidUpdate(prevProps: Readonly<Props>) {}

  get node() {
    return this._node;
  }

  get props(): Props {
    return this._ctx.state || this._ctx.getState();
  }

  update(newProps: Partial<Props>): Promise<void> {
    return new Promise((resolve) => {
      if (!this._ctx.setState) {
        this._ctx.state = { ...this._ctx.state, ...newProps };
        resolve();
      } else {
        this._ctx.state = { ...this._ctx.state, ...newProps };
        this._ctx.setState({ ...this._ctx.state }, resolve);
      }
    });
  }
}
