# React 的初次渲染

react 有一些如下核心的概念，我们弄懂了这些核心的概念应该就能和一般面试官瞎扯忽悠了。

- react 15
  - jsx 是啥
  - jsx 如果渲染成页面
  - 如何渲染原生原生（div,span 等）
  - 如何渲染函数组件
  - 如何渲染类组件
  - React 是如何区分函数组件和类组件
  - 合成事件
  - 批量更新
  - 诡异的 setState
  - dom diff
  - key
  - 生命周期
  - 协调
- react 16
  - fiber
  - 啥叫时间分片，是如何实现的
  - 为什么会有 fiber, fiber 能解决什么问题
  - hooks

本次分享希望能解决的问题：

- jsx 是啥
- jsx 如果渲染成页面
- 如何渲染原生原生（div,span 等）
- 如何渲染函数组件
- 如何渲染类组件
- React 是如何区分函数组件和类组件

## 原生组件的渲染

### src/index.js

```js
// src/index.js
import React, { Component } from './react';
import ReactDOM from './react-dom';

ReactDOM.render(<div>缴费单身</div>, document.getElementById('root'));
```

### shared/ReactElementSymbol.js

```js
// 用于标识对象是reactElement
const REACT_ELEMENT_TYPE = Symbol.for('react.element');

export default REACT_ELEMENT_TYPE;
```

### react/index.js

```js
import { createElement } from './ReactElement';
import Component from './component';

const React = {
  createElement,
  Component,
};

export { createElement, Component };

export default React;
```

### react/ReactElement.js

```js
// 创建虚拟dom
export function createElement(type, config, ...children) {
  let propName;

  const props = {};
  let key = null;
  let ref = null;
  let self = null;
  let source = null;

  if (config != null) {
    if (config.ref) {
      ref = config.ref;
    }

    if (config.key) {
      key = config.key;
    }
    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;

    for (propName in config) {
      if (config.hasOwnProperty(propName) && !RESERVED_PROPS[propName]) {
        props[propName] = config[propName];
      }
    }
  }

  // 简化react对children的处理，react的children可以是对象或者数组
  props.children = children;

  if (type && type.defaultProps) {
    const { defaultProps } = type;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props
  );
}

// 虚拟dom工厂函数
export function ReactElement(type, key, ref, self, source, owner, props) {
  const element = {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
    // 记录是谁创建了这个元素
    _owner: owner,
  };
  return element;
}
```

### react/react-dom/index.js

```js
import { render } from './ReactMount';
const ReactDOM = {
  render,
};

export default ReactDOM;

export { render };
```

### react/react-dom/reactMount.js

```js
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
  // string function
  // 这里就对应了react的三种原生
  if (typeTypeof === 'string') {
    dom = createNativeDOM(element);
  }
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
    parentNode.appendChildren(dom);
  });
}
```

## 类组件的渲染

### react/component.js

```js
export class Component {}

Component.prototype.isReactComponent = {};
```

```js
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
  }
  return dom;
}

export function createClassComponent(element) {
  const { type, props } = element;
  const instance = new type(props);
  const renderElement = instance.render();
  const dom = createDOM(renderElement);

  return dom;
}
```

## 函数组件

```js
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
```
