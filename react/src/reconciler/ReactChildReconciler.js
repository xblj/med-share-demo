import traverseAllChildren from '../shared/traverseAllChildren';
import instantiateReactComponent from './instantiateReactComponent';

function instantiateChild(childInstances, child, name, selfDebugID) {
  // We found a component instance.
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
};

export default ReactChildReconciler;
