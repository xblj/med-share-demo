import ReactUpdates from './ReactUpdates';
import { emptyFunction } from '../shared/utils';
import Transaction from '../shared/Transaction';

var RESET_BATCHED_UPDATES = {
  initialize: emptyFunction,
  close: function () {
    ReactDefaultBatchingStrategy.isBatchingUpdates = false;
  },
};

var FLUSH_BATCHED_UPDATES = {
  initialize: emptyFunction,
  close: ReactUpdates.flushBatchedUpdates.bind(ReactUpdates),
};

var TRANSACTION_WRAPPERS = [FLUSH_BATCHED_UPDATES, RESET_BATCHED_UPDATES];

class ReactDefaultBatchingStrategyTransaction extends Transaction {
  constructor() {
    super();
    this.reinitializeTransaction();
  }
  getTransactionWrappers() {
    return TRANSACTION_WRAPPERS;
  }
}

/**
 * 初始化一个处理事物的实例
 */
const transaction = new ReactDefaultBatchingStrategyTransaction();

const ReactDefaultBatchingStrategy = {
  /**
   * 当前是否处于批量更新中
   */
  isBatchingUpdates: false,
  batchedUpdates(callback, ...args) {
    const { isBatchingUpdates } = ReactDefaultBatchingStrategy;
    ReactDefaultBatchingStrategy.isBatchingUpdates = true;
    if (isBatchingUpdates) {
      return callback(...args);
    } else {
      return transaction.perform(callback, null, ...args);
    }
  },
};

export default ReactDefaultBatchingStrategy;
