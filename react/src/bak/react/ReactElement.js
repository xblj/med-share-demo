import REACT_ELEMENT_TYPE from '../shared/ReactElementSymbol';
import ReactCurrentOwner from './ReactCurrentOwner';

const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
};

export function createElement(type, config, ...children) {
  let propName;

  const props = {};
  let key = null;
  let ref = null;
  let self = null;
  let source = null;

  if (config != null) {
    // undefined
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
