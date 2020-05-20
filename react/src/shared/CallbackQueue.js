import PooledClass from './PooledClass';

class CallBackQueue {
  constructor(arg) {
    this.construct(arg)
  }

  construct(arg) {
    this._callbacks = [];
    this._contexts = [];
    this._arg = arg;
    this._arg = arg;
  }

  enqueue(callback, context) {
    this._callbacks.push(callback);
    this._contexts.push(context);
  }

  notifyAll() {
    const { _callbacks, _contexts, _arg } = this;
    if (_callbacks && _contexts) {
      this._callbacks = [];
      this._contexts = [];
      for (var i = 0; i < _callbacks.length; i++) {
        _callbacks[i].call(_contexts[i], _arg);
      }
      _callbacks.length = 0;
      _callbacks.length = 0;
    }
  }

  checkpoint() {
    return this._callbacks.length;
  }
  rollback(len) {
    this._callbacks.length = len;
    this._contexts.length = len;
  }
  reset() {
    this._callbacks = [];
    this._contexts = [];
  }
  destructor() {
    this.reset();
  }
}

export default PooledClass.addPoolingTo(CallBackQueue);
