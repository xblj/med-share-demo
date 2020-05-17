import ReactChildReconciler from './ReactChildReconciler';
import ReactReconciler from './ReactReconciler';

export default class ReactMultiChild {
  _reconcilerInstantiateChildren(nestedChildren, transaction, context) {
    return ReactChildReconciler.instantiateChildren(
      nestedChildren,
      transaction,
      context
    );
  }
  mountChildren(nestedChildren, transaction, context) {
    const children = this._reconcilerInstantiateChildren(
      nestedChildren,
      transaction,
      context
    );

    this._renderedChildren = children;
    const mountImages = [];
    let index = 0;
    for (const name in children) {
      if (children.hasOwnProperty(name)) {
        const child = children[name];
        const mountImage = ReactReconciler.mountComponent(
          child,
          transaction,
          this,
          this._hostContainerInfo,
          context
        );
        child._mountIndex = index++;
        mountImages.push(mountImage);
      }
    }
    return mountImages;
  }
}
