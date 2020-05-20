import Transaction from '../shared/Transaction';
import CallbackQueue from '../shared/CallbackQueue';
import ReactReconcileTransaction from '../react-dom/ReactReconcileTransaction';
import PooledClass from '../shared/PooledClass';
import ReactReconciler from './ReactReconciler';

let batchingStrategy;
// 所有需要更新的组件
const dirtyComponents = [];
let updateBatchNumber = 0;

const NESTED_UPDATES = {
  initialize: function () {
    // 开始调度之前保存下当前更新的组件个数，完成只有如果有量两者数量对不上，说明在调度过程中
    // 新加入了更新
    this.dirtyComponentsLength = dirtyComponents.length;
  },
  close: function () {
    if (this.dirtyComponentsLength !== dirtyComponents.length) {
      // Additional updates were enqueued by componentDidUpdate handlers or
      // similar; before our own UPDATE_QUEUEING wrapper closes, we want to run
      // these new updates so that if A's componentDidUpdate calls setState on
      // B, B will update before the callback A's updater provided when calling
      // setState.
      dirtyComponents.splice(0, this.dirtyComponentsLength);
      flushBatchedUpdates();
    } else {
      dirtyComponents.length = 0;
    }
  },
};

const UPDATE_QUEUEING = {
  initialize: function () {
    // 清空更新栈
    this.callbackQueue.reset();
  },
  close: function () {
    // 通知所有监听函数
    this.callbackQueue.notifyAll();
  },
};

const TRANSACTION_WRAPPERS = [NESTED_UPDATES, UPDATE_QUEUEING];

function batchedUpdates(callback, ...args) {
  // ReactDefaultBatchingStrategy
  return batchingStrategy.batchedUpdates(callback, ...args);
}

/**
 *
 * @param {ReactComponent} c1
 * @param {ReactComponent} c2
 */
function mountOrderComparator(c1, c2) {
  return c1._mountOrder - c2._mountOrder;
}

/**
 *
 * @param {ReactUpdatesFlushTransaction} transaction
 */
function runBatchedUpdates(transaction) {
  const len = transaction.dirtyComponentsLength;
  dirtyComponents.sort(mountOrderComparator);
  updateBatchNumber++;
  for (let i = 0; i < len; i++) {
    const component = dirtyComponents[i];
    const callbacks = component._pendingCallbacks;
    component._pendingCallbacks = null;
    ReactReconciler.performUpdateIfNecessary(
      component,
      transaction.reconcileTransaction,
      updateBatchNumber
    );
    if (callbacks) {
      for (var j = 0; j < callbacks.length; j++) {
        transaction.callbackQueue.enqueue(
          callbacks[j],
          component.getPublicInstance()
        );
      }
    }
  }
}

function flushBatchedUpdates() {
  while (dirtyComponents.length) {
    if (dirtyComponents.length) {
      const transaction = ReactUpdatesFlushTransaction.getPooled();
      transaction.perform(runBatchedUpdates, null, transaction);
      ReactUpdatesFlushTransaction.release(transaction);
    }
  }
}

function enqueueUpdate(component) {
  if (!batchingStrategy.isBatchingUpdates) {
    batchingStrategy.batchedUpdates(enqueueUpdate, component);
    return;
  }
  dirtyComponents.push(component);
  if (component._updateBatchNumber == null) {
    component._updateBatchNumber = updateBatchNumber + 1;
  }
}

class ReactUpdatesFlushTransaction extends Transaction {
  constructor() {
    super();
    this.construct();
  }
  construct() {
    this.reinitializeTransaction();
    this.dirtyComponentsLength = null;
    // 获取一个CallbackQueue实例
    this.callbackQueue = CallbackQueue.getPooled();
    this.reconcileTransaction = ReactUpdates.ReactReconcileTransaction.getPooled(
      true
    );
  }
  getTransactionWrappers() {
    return TRANSACTION_WRAPPERS;
  }

  destructor() {
    this.dirtyComponentsLength = null;
    CallbackQueue.release(this.callbackQueue);
    this.callbackQueue = null;
    ReactUpdates.ReactReconcileTransaction.release(this.reconcileTransaction);
    this.reconcileTransaction = null;
  }

  perform(method, scope, a) {
    return super.perform.call(
      this,
      this.reconcileTransaction.perform,
      this.reconcileTransaction,
      method,
      scope,
      a
    );
  }
}

PooledClass.addPoolingTo(ReactUpdatesFlushTransaction);

const ReactUpdatesInjection = {
  injectBatchingStrategy(_batchingStrategy) {
    batchingStrategy = _batchingStrategy;
  },
};

const ReactUpdates = {
  batchedUpdates,
  enqueueUpdate,
  flushBatchedUpdates,
  ReactReconcileTransaction,
  injection: ReactUpdatesInjection,
};

export default ReactUpdates;
