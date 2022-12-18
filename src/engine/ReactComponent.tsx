import React from "react";
import { Awaiter } from "./Awaiter";

export abstract class ReactComponent<Props = {}> extends Awaiter {
  private _props0: Props = this.init();
  private _props: Props;
  private _setProps: any;
  private _node: React.ReactNode = (() => {
    const self = this;
    class Outer extends React.Component<{}, Props> {
      state = { ...self._props0 };
      Inner = () => <React.Fragment>{self.render()}</React.Fragment>;
      componentDidMount() {
        self.componentDidMount();
      }
      render(): React.ReactNode {
        const { Inner } = this;
        self._props = this.state;
        self._setProps = this.setState.bind(this);
        return <Inner />;
      }
    }
    return <Outer />;
  })();

  abstract init(): Props;

  abstract render(): React.ReactNode;

  componentDidMount() {}

  get node() {
    return this._node;
  }

  get props() {
    return this._props || this._props0;
  }

  update(newProps: Partial<Props>): Promise<void> {
    return new Promise((resolve) => {
      if (this._setProps) {
        this._setProps({ ...this.props, ...newProps }, resolve);
      } else {
        this._props0 = { ...this._props0, ...newProps };
        resolve();
      }
    });
  }
}
