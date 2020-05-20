import ReactHostComponent from './ReactHostComponent';
import ReactCompositeComponent from './ReactCompositeComponent';

// 避免循环引用
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
 * 实例化各种组件并返回
 * @param {import("react").ReactNode} node
 */
export default function instantiateReactComponent(node) {
  let instance;

  if (typeof node === 'string' || typeof node === 'number') {
    // 创建文本节点，
    instance = ReactHostComponent.createInstanceForText(node);
  } else if (typeof node === 'object') {
    const element = node;
    const { type } = node;
    if (typeof type === 'string') {
      // 原生dom
      instance = ReactHostComponent.createInternalComponent(element);
    } else if (isInternalComponentType(type)) {
      // 一些内部组件，ReactDOMComponent,ReactDOMTextComponent，估计是
      instance = new element.type(element);
    } else {
      // 自定义组件，用户自己写的函数组件或者类组件
      instance = new ReactCompositeComponentWrapper(element);
    }
  } else {
    throw new TypeError('react element error');
  }

  return instance;
}
