import ReactInstanceMap from '../shared/ReactInstanceMap';
import ReactNodeTypes from './ReactNodeTypes';
import ReactReconciler from './ReactReconciler';
import { shallowEqual } from '../shared/utils';
import ReactCurrentOwner from '../react/ReactCurrentOwner';
import shouldUpdateReactComponent from '../shared/shouldUpdateReactComponent';

let nextMountID = 1;

var CompositeTypes = {
  ImpureClass: 0,
  PureClass: 1,
  StatelessFunctional: 2,
};

function isPureComponent(Component) {
  return !!(Component.prototype && Component.prototype.isPureReactComponent);
}

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

    // See ReactUpdateQueue
    this._updateBatchNumber = null;
    this._pendingElement = null;
    this._pendingStateQueue = null;
    this._pendingReplaceState = false;
    this._pendingForceUpdate = false;

    this._renderedNodeType = null;
    this._renderedComponent = null;
    this._context = null;
    this._mountOrder = 0;
    this._topLevelWrapper = null;

    // See ReactUpdates and ReactUpdateQueue.
    this._pendingCallbacks = null;

    // ComponentWillUnmount shall only be called once
    this._calledComponentWillUnmount = false;
  }

  mountComponent(transaction, hostParent, hostContainerInfo, context) {
    this._context = context;
    this._mountOrder = nextMountID++;
    this._hostParent = hostParent;
    this._hostContainerInfo = hostContainerInfo;

    const publicProps = this._currentElement.props;
    const Component = this._currentElement.type;
    const doConstruct = shouldConstruct(Component);
    const updateQueue = transaction.getUpdateQueue();
    // TODO:
    const publicContext = {};
    // 1. 如果是函数组件返回的是一个函数
    // 2. 如果是类组件返回的是一个组件实例
    let inst = this._constructComponent(
      doConstruct,
      publicProps,
      publicContext,
      updateQueue
    );
    let renderedElement;
    if (!doConstruct) {
      // 函数组件
      renderedElement = inst;
      inst = new StatelessComponent(Component);
      this._compositeType = CompositeTypes.StatelessFunctional;
    } else {
      if (isPureComponent(Component)) {
        this._compositeType = CompositeTypes.PureClass;
      } else {
        this._compositeType = CompositeTypes.ImpureClass;
      }
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

    if (inst.componentDidMount) {
      transaction.getReactMountReady().enqueue(inst.componentDidMount, inst);
    }

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

  /**
   *
   * @param {import('../react-dom/ReactReconcileTransaction')} transaction
   */
  performUpdateIfNecessary(transaction) {
    if (this._pendingElement != null) {
      ReactReconciler.receiveComponent(
        this,
        this._pendingElement,
        transaction,
        this._context
      );
    } else if (this._pendingStateQueue !== null || this._pendingForceUpdate) {
      this.updateComponent(
        transaction,
        this._currentElement,
        this._currentElement,
        this._context,
        this._context
      );
    } else {
      this._updateBatchNumber = null;
    }
  }

  updateComponent(
    transaction,
    prevParentElement,
    nextParentElement,
    prevUnmaskedContext,
    nextUnmaskedContext
  ) {
    const inst = this._instance;
    let willReceive = false;
    let nextContext;
    const prevProps = prevParentElement.props;
    const nextProps = nextParentElement.props;
    if (prevParentElement !== nextParentElement) {
      willReceive = true;
    }

    if (willReceive && inst.componentWillReceiveProps) {
      inst.componentWillReceiveProps(nextProps, nextContext);
    }
    const nextState = this._processPendingState(nextProps, nextContext);
    let shouldUpdate = true;

    if (!this._pendingForceUpdate) {
      if (inst.shouldComponentUpdate) {
        shouldUpdate = inst.shouldComponentUpdate(
          nextProps,
          nextState,
          nextContext
        );
      } else {
        if (this._compositeType === CompositeTypes.PureClass) {
          shouldUpdate =
            !shallowEqual(prevProps, nextProps) ||
            !shallowEqual(inst.state, nextState);
        }
      }
    }
    this._updateBatchNumber = null;
    if (shouldUpdate) {
      this._pendingForceUpdate = false;
      this._performComponentUpdate(
        nextParentElement,
        nextProps,
        nextState,
        nextContext,
        transaction,
        nextUnmaskedContext
      );
    } else {
      this._currentElement = nextParentElement;
      this._context = nextUnmaskedContext;
      inst.props = nextProps;
      inst.state = nextState;
      inst.context = nextContext;
    }
  }

  receiveComponent(nextElement, transaction, nextContext) {
    const prevElement = this._currentElement;
    const prevContext = this._context;
    this._pendingElement = null;
    this.updateComponent(
      transaction,
      prevElement,
      nextElement,
      prevContext,
      nextContext
    );
  }

  _performComponentUpdate(
    nextElement,
    nextProps,
    nextState,
    nextContext,
    transaction,
    unmaskedContext
  ) {
    const inst = this._instance;
    const hasComponentUpdate = !!inst.componentDidUpdate;
    let prevProps;
    let prevState;
    let prevContext;
    if (hasComponentUpdate) {
      prevProps = inst.props;
      prevState = inst.state;
      prevContext = inst.context;
    }
    if (inst.componentWillUpdate) {
      inst.componentWillUpdate(nextProps, nextState, nextContext);
    }
    this._currentElement = nextElement;
    this._context = unmaskedContext;
    inst.props = nextProps;
    inst.state = nextState;
    inst.context = nextContext;

    this._updateRenderedComponent(transaction, unmaskedContext);
  }
  _processChildContext() {
    return {};
  }

  _updateRenderedComponent(transaction, context) {
    const prevComponentInstance = this._renderedComponent;
    const prevRenderedElement = prevComponentInstance._currentElement;
    const nextRenderedElement = this._renderValidatedComponent();
    if (shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
      ReactReconciler.receiveComponent(
        prevComponentInstance,
        nextRenderedElement,
        transaction,
        this._processChildContext(context)
      );
    } else {
      // todo
    }
  }

  _renderValidatedComponent() {
    let renderedElement;
    if (this._compositeType !== CompositeTypes.StatelessFunctional) {
      ReactCurrentOwner.current = this;
      renderedElement = this._renderValidatedComponentWithoutOwnerOrContext();
      ReactCurrentOwner.current = null;
    } else {
      renderedElement = this._renderValidatedComponentWithoutOwnerOrContext();
    }
    return renderedElement;
  }

  _renderValidatedComponentWithoutOwnerOrContext() {
    const inst = this._instance;
    let renderedElement;
    renderedElement = inst.render();
    return renderedElement;
  }

  _processPendingState(props, context) {
    const inst = this._instance;
    const queue = this._pendingStateQueue;
    this._pendingStateQueue = null;
    if (!queue) {
      return inst.state;
    }
    const nextState = { ...inst.state };
    for (let i = 0; i < queue.length; i++) {
      var partial = queue[i];
      Object.assign(
        nextState,
        typeof partial === 'function'
          ? partial.call(inst, nextState, props, context)
          : partial
      );
    }
    return nextState;
  }

  _constructComponent(doConstruct, publicProps, publicContext, updateQueue) {
    return this._constructComponentWithoutOwner(
      doConstruct,
      publicProps,
      publicContext,
      updateQueue
    );
  }
  _constructComponentWithoutOwner(
    doConstruct,
    publicProps,
    publicContext,
    updateQueue
  ) {
    const { type: Component } = this._currentElement;
    if (doConstruct) {
      return new Component(publicProps, publicContext, updateQueue);
    } else {
      return Component(publicProps, publicContext, updateQueue);
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
