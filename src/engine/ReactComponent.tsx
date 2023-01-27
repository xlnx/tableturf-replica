import { ReactNode, useMemo, Component } from "react";
import { Awaiter } from "./Awaiter";

export abstract class ReactComponent<Props = {}> extends Awaiter {
  private _ctx: any = { state: this.init() };

  private readonly f = () => {
    const self = this;
    class Outer extends Component<{}, Props> {
      state = { ...self._ctx.state };
      // fp style hook apis work-around
      Inner = () => <>{self.render()}</>;
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
      render(): ReactNode {
        return <this.Inner />;
      }
    }
    // memorize for no-state
    return useMemo(() => <Outer />, []);
  };
  private _node: ReactNode = (<this.f />);

  abstract init(): Props;

  abstract render(): ReactNode;

  componentDidMount() {}

  componentDidUpdate(prevProps: Readonly<Props>) {}

  on(event: string, handler: any) {
    return this.registerEventHandler(event, handler);
  }

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
