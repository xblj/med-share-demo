import DOMLazyTree from '../shared/DOMLazyTree';
import ReactDOMComponentTree from './ReactDOMComponentTree';

export default class ReactDOMTextComponent {
  constructor(text) {
    this._currentElement = text;
    this._stringText = `${text}`;
    this.hostNode = null;
    this._hostParent = null;

    this._domId = 0;
    this._mountIndex = 0;
    this._closingComment = null;
    this._commentNodes = null;
  }
  mountComponent(transaction, hostParent, hostContainerInfo, context) {
    const domID = hostContainerInfo._idCounter++;
    this._domID = domID;
    this._hostParent = hostParent;
    if (transaction.useCreateElement) {
      const ownerDocument = hostContainerInfo._ownerDocument;
      const lazyTree = DOMLazyTree(ownerDocument.createDocumentFragment());
      if (this._stringText) {
        DOMLazyTree.queueChild(
          lazyTree,
          DOMLazyTree(ownerDocument.createTextNode(this._stringText))
        );
      }
      return lazyTree;
    } else {
      return this._stringText;
    }
  }
  receiveComponent(nextText, transaction) {
    console.log('receiveComponent: ReactDOMTextComponent');
  }

  unmountComponent() {
    this._closingComment = null;
    this._commentNodes = null;
    ReactDOMComponentTree.uncacheNode(this);
  }

  getHostNode() {
    return this._stringText;

    // var hostNode = this._commentNodes;
    // if (hostNode) {
    //   return hostNode;
    // }
    // if (!this._closingComment) {
    //   var openingComment = ReactDOMComponentTree.getNodeFromInstance(this);
    //   var node = openingComment.nextSibling;
    //   while (true) {
    //     if (node.nodeType === 8 && node.nodeValue === ' /react-text ') {
    //       this._closingComment = node;
    //       break;
    //     }
    //     node = node.nextSibling;
    //   }
    // }
    // hostNode = [this._hostNode, this._closingComment];
    // this._commentNodes = hostNode;
    // return hostNode;
  }
}
