import ReactDOMTextComponent from '../react-dom/ReactDOMTextComponent';
import ReactDOMComponent from '../react-dom/ReactDOMComponent';

const ReactHostComponent = {
  createInstanceForText(text) {
    return new ReactDOMTextComponent(text);
  },
  createInternalComponent(element) {
    return new ReactDOMComponent(element);
  },
};

export default ReactHostComponent;
