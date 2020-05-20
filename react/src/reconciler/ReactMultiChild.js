import ReactChildReconciler from './ReactChildReconciler';
import ReactReconciler from './ReactReconciler';
import ReactDOMComponentTree from '../react-dom/ReactDOMComponentTree';
import ReactComponentEnvironment from '../react-dom/ReactComponentBrowserEnvironment';
import flattenChildren from '../shared/flattenChildren';

function enqueue(queue, update) {
  if (update) {
    queue = queue || [];
    queue.push(update);
  }
  return queue;
}

function processQueue(inst, updateQueue) {
  const node = ReactDOMComponentTree.getNodeFromInstance(inst);
  ReactComponentEnvironment.processChildrenUpdates(node, updateQueue);
}

function makeMove(child, afterNode, toIndex) {
  // NOTE: Null values reduce hidden classes.
  return {
    type: 'MOVE_EXISTING',
    content: null,
    fromIndex: child._mountIndex,
    fromNode: ReactReconciler.getHostNode(child),
    toIndex: toIndex,
    afterNode: afterNode,
  };
}

function makeRemove(child, node) {
  return {
    type: 'REMOVE_NODE',
    content: null,
    fromIndex: child._mountIndex,
    fromNode: node,
    toIndex: null,
    afterNode: null,
  };
}

function makeInsertMarkup(markup, afterNode, toIndex) {
  // NOTE: Null values reduce hidden classes.
  return {
    type: 'INSERT_MARKUP',
    content: markup,
    fromIndex: null,
    fromNode: null,
    toIndex: toIndex,
    afterNode: afterNode,
  };
}

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

  updateTextContent(textContent) {
    const node = ReactDOMComponentTree.getNodeFromInstance(this);
    console.log(node, textContent);
  }

  updateChildren(nextNestedChildrenElements, transaction, context) {
    this._updateChildren(nextNestedChildrenElements, transaction, context);
  }

  unmountChildren() {
    const renderedChildren = this._renderedChildren;
    ReactChildReconciler.unmountChildren(renderedChildren);
    this._renderedChildren = null;
  }

  moveChild(child, afterNode, toIndex, lastIndex) {
    // If the index of `child` is less than `lastIndex`, then it needs to
    // be moved. Otherwise, we do not need to move it because a child will be
    // inserted or moved before `child`.
    if (child._mountIndex < lastIndex) {
      return makeMove(child, afterNode, toIndex);
    }
  }

  createChild(child, afterNode, mountImage) {
    return makeInsertMarkup(mountImage, afterNode, child._mountIndex);
  }

  _updateChildren(nextNestedChildrenElements, transaction, context) {
    debugger;
    const prevChildren = this._renderedChildren;
    const removedNodes = {};
    const mountImages = [];
    const nextChildren = this._reconcilerUpdateChildren(
      prevChildren,
      nextNestedChildrenElements,
      mountImages,
      removedNodes,
      transaction,
      context
    );
    if (!nextChildren && !prevChildren) {
      return;
    }
    let updates = null;
    let name;
    let nextIndex = 0;
    let lastIndex = 0;
    let nextMountIndex = 0;
    let lastPlacedNode = 0;
    for (name in nextChildren) {
      if (!nextChildren.hasOwnProperty(name)) {
        continue;
      }
      const prevChild = prevChildren && prevChildren[name];
      const nextChild = nextChildren[name];
      if (prevChild === nextChild) {
        // 新老节点相同
        updates = enqueue(
          updates,
          this.moveChild(prevChild, lastPlacedNode, nextIndex, lastIndex)
        );
        lastIndex = Math.max(prevChild._mountIndex, lastIndex);
        prevChild._mountIndex = nextIndex;
      } else {
        if (prevChild) {
          lastIndex = Math.max(prevChild._mountIndex, lastIndex);
        }
        updates = enqueue(
          updates,
          this._mountChildAtIndex(
            nextChild,
            mountImages[nextMountIndex],
            lastPlacedNode,
            nextIndex,
            transaction,
            context
          )
        );
        nextMountIndex++;
      }
      nextIndex++;
      lastPlacedNode = ReactReconciler.getHostNode(nextChild);
    }

    for (const name in removedNodes) {
      if (removedNodes.hasOwnProperty(name)) {
        if (removedNodes.hasOwnProperty(name)) {
          updates = enqueue(
            updates,
            this._unmountChild(prevChildren[name], removedNodes[name])
          );
        }
      }
    }
    if (updates) {
      processQueue(this, updates);
    }
    this._renderedChildren = nextChildren;
  }

  _mountChildAtIndex(
    child,
    mountImage,
    afterNode,
    index,
    transaction,
    context
  ) {
    child._mountIndex = index;
    return this.createChild(child, afterNode, mountImage);
  }

  _reconcilerUpdateChildren(
    prevChildren,
    nextNestedChildrenElements,
    mountImages,
    removedNodes,
    transaction,
    context
  ) {
    // TODO:展平数组
    let nextChildren = flattenChildren(nextNestedChildrenElements);
    ReactChildReconciler.updateChildren(
      prevChildren,
      nextChildren,
      mountImages,
      removedNodes,
      transaction,
      this,
      this._hostContainerInfo,
      context
    );
    return nextChildren;
  }
  _unmountChild(child, node) {
    var update = this.removeChild(child, node);
    child._mountIndex = null;
    return update;
  }
  removeChild(child, node) {
    return makeRemove(child, node);
  }
}
