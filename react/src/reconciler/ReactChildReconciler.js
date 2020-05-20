import traverseAllChildren from '../shared/traverseAllChildren';
import instantiateReactComponent from './instantiateReactComponent';
import shouldUpdateReactComponent from '../shared/shouldUpdateReactComponent';
import ReactReconciler from './ReactReconciler';

function instantiateChild(childInstances, child, name, selfDebugID) {
  var keyUnique = childInstances[name] === undefined;

  if (child != null && keyUnique) {
    childInstances[name] = instantiateReactComponent(child);
  }
}
const ReactChildReconciler = {
  instantiateChildren(nestedChildNodes, transaction, context) {
    if (nestedChildNodes == null) {
      return null;
    }
    const childInstances = {};
    traverseAllChildren(nestedChildNodes, instantiateChild, childInstances);
    return childInstances;
  },
  updateChildren(
    prevChildren,
    nextChildren,
    mountImages,
    removedNodes,
    transaction,
    hostParent,
    hostContainerInfo,
    context
  ) {
    if (!nextChildren && !prevChildren) {
      return;
    }
    let name;
    let prevChild;
    for (name in nextChildren) {
      if (!nextChildren.hasOwnProperty(name)) {
        continue;
      }
      prevChild = prevChildren && prevChildren[name];
      let prevElement = prevChild && prevChild._currentElement;
      let nextElement = nextChildren[name];
      if (
        prevChild != null &&
        shouldUpdateReactComponent(prevElement, nextElement)
      ) {
        ReactReconciler.receiveComponent(
          prevChild,
          nextElement,
          transaction,
          context
        );
        nextChildren[name] = prevChild;
      } else {
        if (prevChild) {
          removedNodes[name] = ReactReconciler.getHostNode(prevChild);
          ReactReconciler.unmountComponent(prevChild);
        }
        const nextChildInstance = instantiateReactComponent(nextElement);
        nextChildren[name] = nextChildInstance;
        const nextChildMountImage = ReactReconciler.mountComponent(
          nextChildInstance,
          transaction,
          hostParent,
          hostContainerInfo,
          context
        );
        mountImages.push(nextChildMountImage);
      }
    }

    for (name in prevChildren) {
      if (
        prevChildren.hasOwnProperty(name) &&
        !(nextChildren && nextChildren.hasOwnProperty(name))
      ) {
        prevChild = prevChildren[name];
        removedNodes[name] = ReactReconciler.getHostNode(prevChild);
        ReactReconciler.unmountComponent(prevChild, false);
      }
    }
  },

  unmountChildren(renderedChildren) {
    for (let name in renderedChildren) {
      if (renderedChildren.hasOwnProperty(name)) {
        let renderedChild = renderedChildren[name];
        ReactReconciler.unmountComponent(renderedChild);
      }
    }
  },
};

export default ReactChildReconciler;
