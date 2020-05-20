const ReactReconciler = {
  mountComponent(
    internalInstance,
    transaction,
    hostParent,
    hostContainerInfo,
    context
  ) {
    var markup = internalInstance.mountComponent(
      transaction,
      hostParent,
      hostContainerInfo,
      context
    );
    return markup;
  },
  performUpdateIfNecessary(internalInstance, transaction, updateBatchNumber) {
    if (internalInstance._updateBatchNumber !== updateBatchNumber) {
      return;
    }
    internalInstance.performUpdateIfNecessary(transaction);
  },

  receiveComponent(internalInstance, nextElement, transaction, context) {
    const prevElement = internalInstance._currentElement;
    if (nextElement === prevElement && context === internalInstance._context) {
      return;
    }

    internalInstance.receiveComponent(nextElement, transaction, context);
  },
  getHostNode(internalInstance) {
    return internalInstance.getHostNode();
  },
  unmountComponent(internalInstance) {
    internalInstance.unmountComponent();
  },
};

export default ReactReconciler;
