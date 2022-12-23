import * as React from "react";
import { Awaiter } from "./Awaiter";

export abstract class ReactComponent<Props = {}> extends Awaiter {
  private _props0: Partial<Props>;
  private _props: Props;
  private _setProps: React.Dispatch<React.SetStateAction<Props>>;
  private _node: React.ReactNode = (() => {
    const Fn = () => {
      [this._props, this._setProps] = React.useState<Props>({
        ...this.init(),
        ...this._props0,
      });
      return <React.Fragment>{this.render()}</React.Fragment>;
    };
    return <Fn></Fn>;
  })();

  abstract init(): Props;

  abstract render(): React.ReactNode;

  get node() {
    return this._node;
  }

  get props() {
    return this._props;
  }

  get setProps() {
    return this._setProps;
  }

  update(newProps: Partial<Props>) {
    if (this._setProps) {
      this.setProps({ ...this.props, ...newProps });
    } else {
      this._props0 = { ...this._props0, ...newProps };
    }
  }
}
