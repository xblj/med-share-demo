class ReactComponent {
  constructor(props, context, updater) {
    this.props = props;
    this.context = context;
    this.refs = {};
    this.updater = updater;
  }
  setState(partialState, callback) {
    this.updater.enqueueSetState(this, partialState);
    if (callback) {
      this.updater.enqueueCallback(this, callback, 'setState');
    }
  }
}

ReactComponent.prototype.isReactComponent = {};

class ReactPureComponent extends ReactComponent {}

ReactPureComponent.prototype.isPureReactComponent = true;

export default {
  Component: ReactComponent,
  PureComponent: ReactPureComponent,
};

export { ReactComponent as Component, ReactPureComponent as PureComponent };
