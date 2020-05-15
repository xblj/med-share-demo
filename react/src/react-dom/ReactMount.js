import REACT_ELEMENT_TYPE from '../shared/ReactElementSymbol';

export function render(element, container) {
  const dom = createDOM(element, container);
  container.appendChild(dom);
}

// 根据ReactElement创建原生dom
export function createDOM(element) {
  if (typeof element === 'string') {
    return document.createTextNode(element);
  }
  let dom;
  const { type, $$typeof } = element;

  if ($$typeof !== REACT_ELEMENT_TYPE) {
    throw new TypeError('不是一个react元素');
  }

  const typeTypeof = typeof type;
  // 这里就对应了react的三种原生
  if (typeTypeof === 'string') {
    dom = createNativeDOM(element);
  } else if (typeTypeof === 'function' && type.prototype.isReactComponent) {
    dom = createClassComponent(element);
  } else {
    dom = createFunctionComponent(element);
  }

  return dom;
}

export function createFunctionComponent(element) {
  const { type, props } = element;
  const renderElement = type(props);
  const dom = createDOM(renderElement);
  return dom;
}

export function createClassComponent(element) {
  const { type, props } = element;
  const instance = new type(props);
  const renderElement = instance.render();
  const dom = createDOM(renderElement);

  return dom;
}

export function createNativeDOM(element) {
  const { type, props } = element;
  const dom = document.createElement(type);
  if (props.children) {
    createChildrenDOM(props.children, dom);
  }
  return dom;
}

export function createChildrenDOM(childrenElement, parentNode) {
  childrenElement.forEach((child) => {
    const dom = createDOM(child);
    parentNode.appendChild(dom);
  });
}
