import ReactInstanceMap from '../shared/ReactInstanceMap';
import ReactUpdates from './ReactUpdates';
/**
 * @typedef { import('../react/index').Component } ReactComponent
 */

/**
 *
 * @param {ReactComponent} publicInstance
 */
function getInternalInstanceReadyForUpdate(publicInstance) {
  const internalInstance = ReactInstanceMap.get(publicInstance);
  return internalInstance || null;
}
function enqueueUpdate(internalInstance) {
  ReactUpdates.enqueueUpdate(internalInstance);
}

const ReactUpdateQueue = {
  isMounted(publicInstance) {
    var internalInstance = ReactInstanceMap.get(publicInstance);
    if (internalInstance) {
      return !!internalInstance._renderedComponent;
    } else {
      return false;
    }
  },

  /**
   *
   * @param {import('../react/index').Component} publicInstance
   * @param {object|function} partialState
   */
  enqueueSetState(publicInstance, partialState) {
    const internalInstance = getInternalInstanceReadyForUpdate(publicInstance);
    if (!internalInstance) return;
    const queue =
      internalInstance._pendingStateQueue ||
      (internalInstance._pendingStateQueue = []);
    queue.push(partialState);
    enqueueUpdate(internalInstance);
  },
};

export default ReactUpdateQueue;
