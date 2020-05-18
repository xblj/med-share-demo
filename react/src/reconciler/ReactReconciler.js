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
};

export default ReactReconciler;
