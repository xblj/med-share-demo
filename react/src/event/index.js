import SyntheticEvent from './SyntheticEvent';
/**
 *
 * @param {Element} dom
 * @param {string} eventName
 * @param {function} eventListener
 */
function addEventListener(dom, eventName, eventListener) {
  eventName = eventName.toLowerCase();
  const eventStore = dom.eventStore || (dom.eventStore = {});
  // 将事件绑定真实dom的自定义属性上
  eventStore[eventName] = eventListener;
  // onclick，去掉前面的on
  document.addEventListener(eventName.slice(2), dispatchEvent, false);
}

/**
 *
 * @param {Event} event
 */
function dispatchEvent(nativeEvent) {
  // event：原生事件对象
  let { type, target } = nativeEvent;
  const eventName = `on${type}`;
  const syntheticEvent = SyntheticEvent.getPooled(nativeEvent);
  while (target) {
    // 模拟事件冒泡
    const { eventStore = {} } = target;
    const listener = eventStore[eventName];

    if (listener) {
      listener.call(target, syntheticEvent);
    }
    if (syntheticEvent.isPropagationStopped()) {
      target = null;
      continue;
    }
    target = target.parentNode;
  }

  if (!syntheticEvent.isPersistent()) {
    // 如果事件处理函数不需要持久化事件对象那么用完就回收进对象池以供下次使用
    SyntheticEvent.release(syntheticEvent);
  }
}

export { addEventListener };
