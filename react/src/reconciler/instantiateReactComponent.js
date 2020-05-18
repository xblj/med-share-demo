import ReactHostComponent from './ReactHostComponent';
import ReactCompositeComponent from './ReactCompositeComponent';

// To avoid a cyclic dependency, we create the final class in this module
class ReactCompositeComponentWrapper extends ReactCompositeComponent {
  _instantiateReactComponent = instantiateReactComponent;
}

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
 * 实例化各种组件返回
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
      instance = new element.type(element);
    } else {
      // 这个地方是啥意思？
      instance = new ReactCompositeComponentWrapper(element);
    }
  } else {
    throw new TypeError('react element error');
  }

  return instance;
}
