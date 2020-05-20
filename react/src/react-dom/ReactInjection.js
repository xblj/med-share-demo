import ReactUpdates from '../reconciler/ReactUpdates';

const ReactInjection = {
  // 由于循环引用了，所以采用动态注入的方式
  Updates: ReactUpdates.injection,
};

export default ReactInjection;
