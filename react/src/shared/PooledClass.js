function getInstance(...args) {
  const Klass = this;
  if (Klass.instancePool.length) {
    const instance = Klass.instancePool.pop();
    // Klass.apply(instance, args);
    instance.construct(...args);
    return instance;
  } else {
    return new Klass(...args);
  }
}
function standardReleaser(instance) {
  const Klass = this;
  instance.destructor();
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance);
  }
}

const DEFAULT_POOLER = getInstance;
const DEFAULT_POOL_SIZE = 10;

function addPoolingTo(CopyConstructor, pooler) {
  const NewKlass = CopyConstructor;
  NewKlass.instancePool = [];
  NewKlass.getPooled = pooler || DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }

  NewKlass.release = standardReleaser;
  return NewKlass;
}
const PooledClass = {
  addPoolingTo,
};

export default PooledClass;
