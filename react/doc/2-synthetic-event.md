# React 深入原理（二）合成事件

本次分享希望达成的目标：

- 理解什么是合成事件
- 理解合成事件对象池的原理
- 知道合成事件对象如何持久化
- 理解 react 合成事件和原生事件注册的不同

react 绑定事件很简单，直接在标签上使用`onXXX`注册一个函数就行了，比如最常用的`onClick`

```jsx
// jsx写法
<div onClick={this.handleClick}>点我</div>

// 原生写法
<div click="handleClick()">原生方法</div>
```

上列中的两种写法原理是否相同呢？jsx 的写法其实就是原生写法的一个语法糖吗？答案肯定不是的，他们之间有着本质的区别，react 是有这自己的一套事件系统机制，称之为“[合成事件](https://react.docschina.org/docs/events.html)”

## 合成事件特点

- 跨浏览器兼容
  - react 对原生事件进行了包装，保证了在各个浏览器中表现一直
- 事件对象池
  - react 的事件对象会被重用，事件函数运行完后，事件对象的属性就会被重置，所以在异步回调里面是无法访问事件对象的属性
- 事件处理函数内部的所有状态更新会被批量处理，
  - 多次`setState({key:value})`，会被统一处理，所以 react 说 setState 可能是异步的。setState 函数本身并不提供异步的功能。比如在定时器`setTimeout`中去 setState，就是同步更新的
- 所有的事件处理函数都会绑定到`document`上而不是元素的本身上

## 简易实现过程

> 该实现并不是源码的一比一的实现，源码中，不同的事件有对应着不同的处理方法，以及各种兼容，本文实现只是一个极简版本

### react-dom/ReactMount.js

在上次的基础添加属性处理

```diff
export function createNativeDOM(element) {
  const { type, props } = element;
  const dom = document.createElement(type);
  if (props.children) {
    createChildrenDOM(props.children, dom);
  }
+  // 处理props
+  setProps(dom, props);
  return dom;
}

+ function setProps(dom, props) {
+  Object.keys(props).forEach((key) => {
+    if (key === 'children') return;
+    if (/^on/.test(key)) {
+     // 所有已on开头的属性都是事件绑定
+      addEventListener(dom, key, props[key]);
+    } else if (key === 'style') {
+      setStyle(dom, props[key]);
+    } else if (key === 'className') {
+      dom.setAttribute('class', props[key]);
+    } else {
+      dom.setAttribute(key, props[key]);
+    }
+   });
+ }

+ function setStyle(dom, styles) {
+  Object.keys(styles).forEach((key) => {
+    dom.style[key] = styles[key];
+  });
+ }
```

### event/SyntheticEvent.js

首先声明一个合成事件对象用于实例化事件对象，该事件对象就是将原生事件的的所有属性拷贝一份放在自己的属性上。

```js
class SyntheticEvent {
  constructor(nativeEvent) {
    this.isPersist = false;
    this.nativeEvent = nativeEvent;
    this.currentTarget = nativeEvent.target;
    for (const key in nativeEvent) {
      if (typeof nativeEvent[key] === 'function') {
        this[key] = nativeEvent[key].bind(nativeEvent);
      } else {
        this[key] = nativeEvent[key];
      }
    }
  }
}

export default SyntheticEvent;
```

### event/index.js

处理事件绑定

```js
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
  // 将事件绑定真实dom的自定义属性上，便于后面取用
  eventStore[eventName] = eventListener;
  // onclick，去掉前面的on
  document.addEventListener(eventName.slice(2), dispatchEvent, false);
}

/**
 * 所有绑定的函数都是由这个函数来进行调用
 * @param {Event} event
 */
function dispatchEvent(nativeEvent) {
  // event：原生事件对象
  let { type, target } = nativeEvent;
  // 将click构造成onclick
  const eventName = `on${type}`;
  // 实例化一个合成事件对象
  const syntheticEvent = new SyntheticEvent(nativeEvent);
  while (target) {
    const { eventStore = {} } = target;
    // 取出当前的事件处理函数
    const listener = eventStore[eventName];
    if (listener) {
      listener.call(target, syntheticEvent);
    }
    // 模拟事件冒泡，依次触发父级的事件处理函数
    target = target.parentNode;
  }
}

export default {
  addEventListener,
};
```

实现`preventDefault`和`stopPropagation`，在处理函数中调用原生事件对象的对应方法

### event/syntheticEvent.js

```diff
+ function returnTrue() {
+  return true;
+ }
+ function returnFalse() {
+  return false;
+ }

class SyntheticEvent {
  /**
   *
   * @param {Event} nativeEvent
   */
  constructor(nativeEvent) {
+    this.isPropagationStopped = returnFalse;
+    this.isDefaultPrevented = returnFalse;
    this.nativeEvent = nativeEvent;
    this.currentTarget = nativeEvent.target;

    for (const key in nativeEvent) {
      // 如果是已经定义过值了就不再用原生的值如：preventDefault和stopPropagation
+      if (this[key]) continue;
      if (typeof nativeEvent[key] === 'function') {
        this[key] = nativeEvent[key].bind(nativeEvent);
      } else {
        this[key] = nativeEvent[key];
      }
    }
  }


+  preventDefault() {
+    const { nativeEvent } = this;
+    // 调用原生事件的preventDefault
+    nativeEvent.preventDefault();
+    // 将标识阻止冒泡
+    this.isDefaultPrevented = returnTrue;
+  }

+  stopPropagation() {
+    const { nativeEvent } = this;
+    nativeEvent.stopPropagation();
+    this.isPropagationStopped = returnTrue;
+ }

+  isPropagationStopped = returnFalse;
+  isDefaultPrevented = returnFalse;
}

export default SyntheticEvent;
```

### event/index.js

```diff

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
+    // 判断是否有阻止冒泡，如果有者结束循环
+    if (syntheticEvent.isPropagationStopped()) {
+      target = null;
+      continue;
+    }
    target = target.parentNode;
  }
}
```

到此一个简单的合成事件就基本完成了，但是上面的实现每次都会创建一个新的合成事件对象，挺耗费性能的，所以 react 为合成事件类添加了一个对象池，将用完的对象放入对象池中，下次直接复用这个对象就行了，下面我来实现下对象池。主要思路如下：

1. 添加一个静态属性`instancePool`的数组，用于存放所有使用过的对象
2. 添加一个静态方法`getPooled`，用户获取一个对象并初始化这个实例。

   - 在`instancePool`中没有可用对象时使用`new`关键词创建一个新的对象
   - 如果`instancePool`中有可用对象，则直接将最后一个对象`pop`出来，并调用实例上的`construct`方法进行初始化

3. 再添加一个静态方法`release`，用于将对象释放，放入到对象池`instancePool`中，供下次使用
   - `release`方法需要去调用实例对象的`destructor`方法，对象可以在在这个方法中做一些清理工作

### /shared/PooledClass.js

```js
// 对象池的大小，默认最大支持缓存10个对象
const POOL_SIZE = 10;
/**
 * 从对象池中获取一个对象，如果没有话就新创建一个
 * @param  {...any} args
 */
function defaultPooler(...args) {
  // 这里的Klass指向的是类的构造函数
  const Klass = this;
  if (Klass.instancePool.length) {
    // 如果对象池中有可用对象则直接返回
    const instance = Klass.instancePool.pop();
    // 由于语法限制，类必须使用new调用，所有我们可以实现一个属性用于初始化对象
    instance.construct(...args);
    return instance;
  } else {
    // 没有可用对象，初始化一个
    return new Klass(...args);
  }
}

function standardReleaser(instance) {
  // 这里的Klass指向的是类的构造函数
  const Klass = this;
  // 类定义的时候必须实现该方法，用于清了当前对象的属性
  instance.destructor();
  if (Klass.instancePool.length < Klass.poolSize) {
    // 如果对象池小于poolSize，则放入对象池中
    Klass.instancePool.push(instance);
  }
}

/**
 *
 * @param {function} CopyConstructor 类构造函数
 */
function addPoolingTo(CopyConstructor) {
  const NewKlass = CopyConstructor;
  // 对象池
  NewKlass.instancePool = [];
  // 从对象池中获取一个对象
  NewKlass.getPooled = defaultPooler;
  if (!NewKlass.poolSize) {
    // 设置对象池大小为10个
    NewKlass.poolSize = POOL_SIZE;
  }
  // 释放对象，如果需要放入对象池
  NewKlass.release = standardReleaser;
  return NewKlass;
}

export { addPoolingTo };
```

### /event/SyntheticEvent.js

```diff
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
    // 将初始化放入到construct中
    this.construct(nativeEvent);
  }

  /**
   * 对象池中对象在重用的时候会调用该方法来初始化本次对象
   * @param {Event} nativeEvent
   */
  construct(nativeEvent) {
+    Object.keys(this).forEach((key) => {
+      // 由于在回收的时候设置了setter/getter所有需要删除这个属性，否则会赋值不上
+      delete this[key];
+    });
+    this.isPersistent = returnFalse;
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
+  persist() {
+    this.isPersistent = returnTrue;
+  }

+  isPersistent = returnFalse;
  isPropagationStopped = returnFalse;
  isDefaultPrevented = returnFalse;

  /**
   * 回收对象放入对象池
   */
+  destructor() {
+    const ins = this;
+    for (const key in ins) {
+      if (ins.hasOwnProperty(key)) {
+        Object.defineProperty(this, key, {
+          get() {
+            console.error('对已经销毁了');
+            return null;
+          },
+          set(value) {
+            return value;
+          },
+        });
+      }
+    }
+  }
}

+ // 导出经过池化的对象
+ export default addPoolingTo(SyntheticEvent);
```

### event/index.js

```diff
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

+  if (!syntheticEvent.isPersistent()) {
+    // 如果事件处理函数不需要持久化事件对象那么用完就回收进对象池以供下次使用
+    SyntheticEvent.release(syntheticEvent);
+  }
}
```

## 下次预告

- 组件的的更新流程
- dom diff
- 批量更新
- 生命周期
