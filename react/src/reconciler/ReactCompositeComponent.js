import ReactInstanceMap from '../shared/ReactInstanceMap';
import ReactNodeTypes from './ReactNodeTypes';
import ReactReconciler from './ReactReconciler';

let nextMountID = 1;

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent);
}

function StatelessComponent(Component) {}
StatelessComponent.prototype.render = function () {
  var Component = ReactInstanceMap.get(this)._currentElement.type;
  var element = Component(this.props, this.context, this.updater);
  return element;
};

export default class ReactCompositeComponent {
  constructor(element) {
    this._currentElement = element;
    this._rootNodeID = 0;
    this._compositeType = null;
    this._instance = null;
    this._hostParent = null;
    this._hostContainerInfo = null;

    this._renderedNodeType = null;
    this._renderedComponent = null;
    this._context = null;
    this._mountOrder = 0;
    this._topLevelWrapper = null;
  }

  mountComponent(transaction, hostParent, hostContainerInfo, context) {
    this._context = context;
    this._mountOrder = nextMountID++;
    this._hostParent = hostParent;
    this._hostContainerInfo = hostContainerInfo;
    const publicProps = this._currentElement.props;
    const Component = this._currentElement.type;
    const doConstruct = shouldConstruct(Component);

    let inst = this._constructComponent(doConstruct, publicProps);
    let renderedElement;
    if (!doConstruct) {
      renderedElement = inst;
      inst = new StatelessComponent(Component);
    }
    inst.props = publicProps;

    this._instance = inst;
    ReactInstanceMap.set(inst, this);

    let initialState = inst.state;
    if (initialState === undefined) {
      inst.state = initialState = null;
    }
    const markup = this.performInitialMount(
      renderedElement,
      hostParent,
      hostContainerInfo,
      transaction,
      context
    );
    return markup;
  }

  performInitialMount(
    renderedElement,
    hostParent,
    hostContainerInfo,
    transaction,
    context
  ) {
    const inst = this._instance;
    if (renderedElement === undefined) {
      renderedElement = inst.render();
    }
    this._renderedNodeType = ReactNodeTypes.getType(renderedElement);
    const child = this._instantiateReactComponent(renderedElement);
    this._renderedComponent = child;
    var markup = ReactReconciler.mountComponent(
      child,
      transaction,
      hostParent,
      hostContainerInfo
    );
    return markup;
  }
  _constructComponent(doConstruct, publicProps) {
    return this._constructComponentWithoutOwner(doConstruct, publicProps);
  }
  _constructComponentWithoutOwner(doConstruct, publicProps) {
    const { type: Component } = this._currentElement;
    if (doConstruct) {
      return new Component(publicProps);
    } else {
      return Component(publicProps);
    }
  }

  _instantiateReactComponent() {
    // 子类重写
  }

  getPublicInstance() {
    var inst = this._instance;
    // if (this._compositeType === CompositeTypes.StatelessFunctional) {
    //   return null;
    // }
    return inst;
  }
}
