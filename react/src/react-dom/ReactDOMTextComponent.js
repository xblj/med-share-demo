import DOMLazyTree from './utils/DOMLazyTree';

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
  receiveComponent(nextText, transaction) {}
}
