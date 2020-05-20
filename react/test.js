function getInstance(...args) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.apply(instance, args);
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

class Person {
  constructor(name) {
    this.name = name;
  }
  destructor() {}
}

PooledClass.addPoolingTo(Person);

// const inst1 = Person.getPooled('inst1');
// console.log(inst1);
// Person.release(inst1);
// const inst2 = Person.getPooled('inst2');
// console.log(inst2);
