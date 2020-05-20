export default class TransactionImpl {
  constructor() {
    this._isInTransaction = false;
  }

  reinitializeTransaction() {
    this.transactionWrappers = this.getTransactionWrappers();
    if (this.wrapperInitData) {
      this.wrapperInitData.length = 0;
    } else {
      this.wrapperInitData = [];
    }
    this._isInTransaction = false;
  }

  isInTransaction() {
    return !!this._isInTransaction;
  }
  /**
   * 开始执行事物
   * @param {function} method 运行的方法
   * @param {*} scope 运行方法的this指向
   * @param  {...any} args 参数
   */
  perform(method, scope, ...args) {
    let ret;
    // 设置是否开始处理
    this._isInTransaction = true;
    this.initializeAll(0);
    ret = method.apply(scope, args);
    this.closeAll(0);
    this._isInTransaction = false;
    return ret;
  }
  initializeAll(startIndex) {
    const { transactionWrappers } = this;
    for (let i = startIndex; i < transactionWrappers.length; i++) {
      const wrapper = transactionWrappers[i];
      this.wrapperInitData[i] = wrapper.initialize
        ? wrapper.initialize.call(this)
        : null;
    }
  }

  closeAll(startIndex) {
    const { transactionWrappers } = this;
    for (let i = startIndex; i < transactionWrappers.length; i++) {
      const wrapper = transactionWrappers[i];
      const initData = this.wrapperInitData[i];
      if (wrapper.close) {
        wrapper.close.call(this, initData);
      }
    }
    this.wrapperInitData.length = 0;
  }

  /**
   * 子类需要覆写
   * @abstract
   */
  getTransactionWrappers() {
    throw new Error('子类需要实现该方法');
  }
}
