import REACT_ELEMENT_TYPE from '../shared/ReactElementSymbol';
import { addEventListener } from '../event';

export function render(element, container) {
  const dom = createDOM(element, container);
  container.appendChild(dom);
}

// 根据ReactElement创建原生dom
export function createDOM(element) {
  if (typeof element === 'string' || typeof element === 'number') {
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
  setProps(dom, props);
  return dom;
}

function setProps(dom, props) {
  Object.keys(props).forEach((key) => {
    if (key === 'children') return;
    if (/^on/.test(key)) {
      addEventListener(dom, key, props[key]);
    } else if (key === 'style') {
      setStyle(dom, props[key]);
    } else if (key === 'className') {
      dom.setAttribute('class', props[key]);
    } else {
      dom.setAttribute(key, props[key]);
    }
  });
}

function setStyle(dom, styles) {
  Object.keys(styles).forEach((key) => {
    dom.style[key] = styles[key];
  });
}

export function createChildrenDOM(childrenElement, parentNode) {
  childrenElement.forEach((child) => {
    const dom = createDOM(child);
    parentNode.appendChild(dom);
  });
}
