import Transaction from '../shared/Transaction';
import CallbackQueue from '../shared/CallbackQueue';
import PooledClass from '../shared/PooledClass';
import ReactUpdateQueue from '../reconciler/ReactUpdateQueue';

/**
 * 用于收集 `componentDidMount` 和  `componentDidUpdate`回调函数
 */
var ON_DOM_READY_QUEUEING = {
  /**
   * 初始化 `onDOMReady`回调
   */
  initialize: function () {
    this.reactMountReady.reset();
  },

  /**
   * 所有dom更新完成后，调用所有注册了 `onDOMReady`的回调函数
   */
  close: function () {
    this.reactMountReady.notifyAll();
  },
};
const TRANSACTION_WRAPPERS = [
  // SELECTION_RESTORATION,
  // EVENT_SUPPRESSION,
  ON_DOM_READY_QUEUEING,
];

class ReactReconcileTransaction extends Transaction {
  constructor(useCreateElement) {
    super();
   this.construct(useCreateElement)
  }

  construct(useCreateElement) {
    this.reinitializeTransaction();
    this.renderToStaticMarkup = false;
    this.reactMountReady = CallbackQueue.getPooled(null);
    this.useCreateElement = useCreateElement;
  }

  getTransactionWrappers() {
    return TRANSACTION_WRAPPERS;
  }

  getReactMountReady() {
    return this.reactMountReady;
  }

  checkpoint() {
    // reactMountReady is the our only stateful wrapper
    return this.reactMountReady.checkpoint();
  }

  rollback(checkpoint) {
    this.reactMountReady.rollback(checkpoint);
  }
  /**
   * 将创建的CallbackQueue实例放回对象池
   */
  destructor() {
    CallbackQueue.release(this.reactMountReady);
    this.reactMountReady = null;
  }

  getUpdateQueue() {
    return ReactUpdateQueue;
  }
}

export default PooledClass.addPoolingTo(ReactReconcileTransaction);
