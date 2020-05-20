import ReactDefaultBatchingStrategy from '../reconciler/ReactDefaultBatchingStrategy';
import ReactInjection from './ReactInjection';

let alreadyInjected = false;
function inject() {
  if (alreadyInjected) return;

  alreadyInjected = true;
  ReactInjection.Updates.injectBatchingStrategy(ReactDefaultBatchingStrategy);
}
const ReactDefaultInjection = {
  inject,
};
export default ReactDefaultInjection;
