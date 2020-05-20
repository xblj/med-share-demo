import { createElement } from '../react/ReactElement';
import ReactDOMComponentTree from './ReactDOMComponentTree';
import instantiateReactComponent from '../reconciler/instantiateReactComponent';
import ReactReconciler from '../reconciler/ReactReconciler';
import ReactDOMContainerInfo from '../react/ReactDOMContainerInfo';
import DOMLazyTree from '../shared/DOMLazyTree';
import ReactUpdates from '../reconciler/ReactUpdates';
import ReactDefaultInjection from './ReactDefaultInjection';

ReactDefaultInjection.inject();

// const DOC_NODE_TYPE = 9;
var instancesByReactRootID = {};

/**
 * @param {DOMElement|DOMDocument} container 可能包含React组件的DOM元素
 * @return {?*} 有reactRoot ID的DOM元素或者null
 */
// function getReactRootElementInContainer(container) {
//   if (!container) {
//     return null;
//   }

//   if (container.nodeType === DOC_NODE_TYPE) {
//     return container.documentElement;
//   } else {
//     return container.firstChild;
//   }
// }

// function getHostRootInstanceInContainer(container) {
//   // 初始渲染是null
//   var rootEl = getReactRootElementInContainer(container);

//   var prevHostInstance =
//     rootEl && ReactDOMComponentTree.getInstanceFromNode(rootEl);
//   return prevHostInstance && !prevHostInstance._hostParent
//     ? prevHostInstance
//     : null;
// }

// function getTopLevelWrapperInContainer(container) {
//   var root = getHostRootInstanceInContainer(container);
//   return root ? root._hostContainerInfo._topLevelWrapper : null;
// }

function _mountImageIntoNode(
  markup,
  container,
  instance,
  shouldReuseMarkup,
  transaction
) {
  if (transaction.useCreateElement) {
    while (container.lastChild) {
      container.removeChild(container.lastChild);
    }
    DOMLazyTree.insertTreeBefore(container, markup, null);
  } else {
    // setInnerHTML(container, markup);
    container.innerHTML = markup;
    ReactDOMComponentTree.precacheNode(instance, container.firstChild);
  }
}

/**
 * Mounts this component and inserts it into the DOM.
 * 挂载组件并且插入到dom中取
 *
 * @param {ReactComponent} componentInstance The instance to mount.
 * @param {DOMElement} container DOM element to mount into.
 * @param {ReactReconcileTransaction} transaction
 * @param {boolean} shouldReuseMarkup If true, do not insert markup
 */
function mountComponentIntoNode(
  wrapperInstance,
  container,
  transaction,
  shouldReuseMarkup,
  context
) {
  var markup = ReactReconciler.mountComponent(
    wrapperInstance,
    transaction,
    null,
    ReactDOMContainerInfo(wrapperInstance, container),
    context
  );

  wrapperInstance._renderedComponent._topLevelWrapper = wrapperInstance;
  _mountImageIntoNode(
    markup,
    container,
    wrapperInstance,
    shouldReuseMarkup,
    transaction
  );
}

/**
 * Batched mount.
 *
 * @param {ReactComponent} componentInstance The instance to mount.
 * @param {DOMElement} container DOM element to mount into.
 * @param {boolean} shouldReuseMarkup If true, do not insert markup
 */
function batchedMountComponentIntoNode(
  componentInstance,
  container,
  shouldReuseMarkup,
  context
) {
  const transaction = ReactUpdates.ReactReconcileTransaction.getPooled(
    /* useCreateElement */
    !shouldReuseMarkup && true
  );

  transaction.perform(
    mountComponentIntoNode,
    null,
    componentInstance,
    container,
    transaction,
    shouldReuseMarkup,
    context
  );
  ReactUpdates.ReactReconcileTransaction.release(transaction);
}

var topLevelRootCounter = 1;
var TopLevelWrapper = function () {
  this.rootID = topLevelRootCounter++;
};
TopLevelWrapper.prototype.isReactComponent = {};

TopLevelWrapper.prototype.render = function () {
  return this.props.child;
};
TopLevelWrapper.isReactTopLevelWrapper = true;

/**
 *
 * @param {ReactElement} nextElement
 * @param {DOMElement} container
 * @param {boolean} shouldReuseMarkup 是否重用现有的dom结构，好像是只有服务端渲染的时候才会是true
 * @param {object} context
 * @returns {ReactComponent}
 */
function _renderNewRootComponent(
  nextElement,
  container,
  shouldReuseMarkup,
  context
) {
  // 根据reactElement实例化一个组件实例
  const componentInstance = instantiateReactComponent(nextElement);
  // 1. 组件实例挂载到dom节点中
  // 2. 完成回去调用ReactUpdates.flushBatchedUpdates
  ReactUpdates.batchedUpdates(
    batchedMountComponentIntoNode,
    componentInstance,
    container,
    shouldReuseMarkup,
    context
  );
  var wrapperID = componentInstance._instance.rootID;
  // 在根节点的全局变量中缓存已经挂载的组件实例
  instancesByReactRootID[wrapperID] = componentInstance;
  return componentInstance;
}

function _renderSubtreeIntoContainer(
  parentComponent,
  nextElement,
  container,
  callback
) {
  // 将根组件包装一下，这样的话，就不需要判断根组件传递的到底是什么类型的组件
  const nextWrappedElement = createElement(TopLevelWrapper, {
    child: nextElement,
  });

  const component = _renderNewRootComponent(
    nextWrappedElement,
    container,
    false,
    {}
  )._renderedComponent.getPublicInstance();
}

function render(nextElement, container, callback) {
  return _renderSubtreeIntoContainer(null, nextElement, container, callback);
}

export { render };

export default { render };
