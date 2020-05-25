const POOL_SIZE = 10;
/**
 * 从对象池中获取一个对象，如果没有话就新创建一个
 * @param  {...any} args
 */
function defaultPooler(...args) {
  const Klass = this;
  if (Klass.instancePool.length) {
    // 如果对象池中有可用对象则直接返回
    const instance = Klass.instancePool.pop();
    instance.construct(...args);
    return instance;
  } else {
    // 没有可用对象，初始化一个
    return new Klass(...args);
  }
}

function standardReleaser(instance) {
  const Klass = this;
  // 类定义的时候必须实现该方法，用于清了当前对象的属性
  instance.destructor();
  if (Klass.instancePool.length < Klass.poolSize) {
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
  // 释放对象
  NewKlass.release = standardReleaser;
  return NewKlass;
}

export { addPoolingTo };
