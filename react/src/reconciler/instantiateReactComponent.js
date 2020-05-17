import ReactHostComponent from './ReactHostComponent';

/**
 * 检测是否是内部已知的类型
 * @param {function} type
 */
function isInternalComponentType(type) {
  return (
    typeof type === 'function' &&
    typeof type.prototype !== 'undefined' &&
    typeof type.prototype.mountComponent === 'function' &&
    typeof type.prototype.receiveComponent === 'function'
  );
}

/**
 *
 * @param {import("react").ReactNode} node
 */
export default function instantiateReactComponent(node) {
  let instance;
  if (typeof node === 'string' || typeof node === 'number') {
    instance = ReactHostComponent.createInstanceForText(node);
  } else if (typeof node === 'object') {
    const element = node;
    const { type } = node;
    if (typeof type === 'string') {
      instance = ReactHostComponent.createInternalComponent(element);
    } else if (isInternalComponentType(type)) {
      // 函数或者类组件
    } else {
      // 这个地方是啥意思？
    }
  } else {
    throw new TypeError('react element error');
  }

  return instance;
}
