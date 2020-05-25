import { addPoolingTo } from '../shared/PooledClass';

function returnTrue() {
  return true;
}
function returnFalse() {
  return false;
}

class SyntheticEvent {
  /**
   *
   * @param {Event} nativeEvent
   */
  constructor(nativeEvent) {
    this.construct(nativeEvent);
  }

  /**
   * 对象池中对象在重用的时候会调用该方法来初始化本次对象
   * @param {Event} nativeEvent
   */
  construct(nativeEvent) {
    Object.keys(this).forEach((key) => {
      // 由于在回收的时候设置了setter/getter所有需要删除这个属性，否则会赋值不上
      delete this[key];
    });
    this.isPersistent = returnFalse;
    this.isPropagationStopped = returnFalse;
    this.isDefaultPrevented = returnFalse;
    this.nativeEvent = nativeEvent;
    this.currentTarget = nativeEvent.target;

    for (const key in nativeEvent) {
      // 如果是已经定义过值了就不再用原生的值如：preventDefault和stopPropagation
      if (this[key]) continue;
      if (typeof nativeEvent[key] === 'function') {
        this[key] = nativeEvent[key].bind(nativeEvent);
      } else {
        this[key] = nativeEvent[key];
      }
    }
  }

  preventDefault() {
    const { nativeEvent } = this;
    nativeEvent.preventDefault();
    this.isDefaultPrevented = returnTrue;
  }

  stopPropagation() {
    const { nativeEvent } = this;
    nativeEvent.stopPropagation();
    this.isPropagationStopped = returnTrue;
  }

  /**
   * 由于事件对象默认会被回收进对象池，调用此函数将事件对象留给事件处理函数处理，不会再放入对象池
   */
  persist() {
    this.isPersistent = returnTrue;
  }

  isPersistent = returnFalse;
  isPropagationStopped = returnFalse;
  isDefaultPrevented = returnFalse;

  /**
   * 回收对象放入对象池
   */
  destructor() {
    const ins = this;
    for (const key in ins) {
      if (ins.hasOwnProperty(key)) {
        Object.defineProperty(this, key, {
          get() {
            console.error('对已经销毁了');
            return null;
          },
          set(value) {
            return value;
          },
        });
      }
    }
  }
}

export default addPoolingTo(SyntheticEvent);
