import ReactDOMComponentTree from './ReactDOMComponentTree';
import DOMPropertyOperations from './DOMPropertyOperations';
import ReactMultiChild from '../reconciler/ReactMultiChild';
import ReactDOMComponentFlags from '../shared/ReactDOMComponentFlags';
import DOMLazyTree from '../shared/DOMLazyTree';

const CONTENT_TYPES = { string: true, number: true };
const getNode = ReactDOMComponentTree.getNodeFromInstance;

let globalIdCounter = 1;
export default class ReactDOMComponent extends ReactMultiChild {
  static displayName = 'ReactDOMComponent';

  constructor(element) {
    super();
    const { type: tag } = element;
    this._currentElement = element;
    this._tag = tag.toLowerCase();
    this._renderedChildren = null;
    this._hostNode = null;
    this._hostParent = null;
    this._rootNodeID = 0;
    this._domID = 0;
    this._hostContainerInfo = null;
    this._wrapperState = null;
    this._flags = 0;
    this._topLevelWrapper = null;
  }

  /**
   *
   * @param {ReactReconcileTransaction} transaction
   * @param {*} hostParent
   * @param {*} hostContainerInfo
   * @param {*} context
   */
  mountComponent(transaction, hostParent, hostContainerInfo, context) {
    this._rootNodeID = globalIdCounter++;
    this._domID = hostContainerInfo._idCounter++;
    this._hostParent = hostParent;
    this._hostContainerInfo = hostContainerInfo;

    const props = this._currentElement.props;

    let mountImage;
    if (transaction.useCreateElement) {
      const ownerDocument = hostContainerInfo._ownerDocument;
      const el = ownerDocument.createElement(this._currentElement.type);
      ReactDOMComponentTree.precacheNode(this, el);
      this._flags |= ReactDOMComponentFlags.hasCachedChildNodes;
      if (!this._hostParent) {
        DOMPropertyOperations.setAttributeForRoot(el);
      }
      this._updateDOMProperties(null, props, transaction);
      const lazyTree = DOMLazyTree(el);
      this._createInitialChildren(transaction, props, context, lazyTree);
      mountImage = lazyTree;
    }

    return mountImage;
  }

  receiveComponent(nextElement, transaction, context) {
    const prevElement = this._currentElement;
    this._currentElement = nextElement;
    this.updateComponent(transaction, prevElement, nextElement, context);
  }

  updateComponent(transaction, prevElement, nextElement, context) {
    const lastProps = prevElement.props;
    const nextProps = this._currentElement.props;
    this._updateDOMProperties(lastProps, nextProps, transaction, context);
    this._updateDOMChildren(lastProps, nextProps, transaction, context);
  }

  unmountComponent() {
    this.unmountChildren();
    ReactDOMComponentTree.uncacheNode(this);
    this._rootNodeID = 0;
    this._domID = 0;
    this._wrapperState = null;
  }

  getHostNode() {
    return getNode(this);
  }

  _updateDOMChildren(lastProps, nextProps, transaction, context) {
    const lastContent = CONTENT_TYPES[typeof lastProps.children]
      ? lastProps.children
      : null;
    const nextContent = CONTENT_TYPES[typeof nextProps.children]
      ? nextProps.children
      : null;
    const lastHtml =
      lastProps.dangerouslySetInnerHTML &&
      lastProps.dangerouslySetInnerHTML.__html;
    const nextHtml =
      nextProps.dangerouslySetInnerHTML &&
      nextProps.dangerouslySetInnerHTML.__html;

    const lastChildren = lastContent != null ? null : lastProps.children;
    const nextChildren = nextContent != null ? null : nextProps.children;

    const lastHasContentOrHtml = lastContent != null || lastHtml != null;
    const nextHasContentOrHtml = nextContent != null || nextHtml != null;
    if (lastChildren != null && nextChildren == null) {
      // 之前有现在没有了
      this.updateChildren(null, transaction, context);
    } else if (lastHasContentOrHtml && !nextHasContentOrHtml) {
      this.updateTextContent('');
    }

    if (nextContent != null) {
      if (lastContent !== nextContent) {
        this.updateTextContent(`${nextContent}`);
      }
    } else if (nextHtml != null) {
      this.updateMarkup(`${nextHtml}`);
    } else if (nextChildren != null) {
      this.updateChildren(nextChildren, transaction, context);
    }
  }

  /**
   *
   * @param {*} transaction
   * @param {*} props
   * @param {*} context
   * @param {DOMLazyTree} lazyTree
   */
  _createInitialChildren(transaction, props, context, lazyTree) {
    const innerHTML = props.dangerouslySetInnerHTML;
    if (innerHTML != null) {
      if (innerHTML.__html != null) {
        DOMLazyTree.queueHTML(lazyTree, innerHTML.__html);
      }
    } else {
      const contentToUse = CONTENT_TYPES[typeof props.children]
        ? props.children
        : null;
      const childrenToUse = contentToUse != null ? null : props.children;
      if (contentToUse != null) {
        if (contentToUse !== '') {
          DOMLazyTree.queueText(lazyTree, contentToUse);
        }
      } else if (childrenToUse != null) {
        const mountImages = this.mountChildren(
          childrenToUse,
          transaction,
          context
        );
        for (var i = 0; i < mountImages.length; i++) {
          DOMLazyTree.queueChild(lazyTree, mountImages[i]);
        }
      }
    }
  }

  _updateDOMProperties(lastProps, nextProps, transaction) {
    // let propKey;
    // let styleName;
    // let styleUpdates;
    // for (propKey in lastProps) {
    //   if (
    //     nextProps.hasOwnProperty(propKey) ||
    //     !lastProps.hasOwnProperty(propKey) ||
    //     lastProps[propKey] == null
    //   ) {
    //     continue;
    //   }
    //   if (propKey === 'style') {
    //     let lastStyle = this._previousStyleCopy;
    //     for (styleName in lastStyle) {
    //       if (lastStyle.hasOwnProperty(styleName)) {
    //         styleUpdates = styleUpdates || {};
    //         styleUpdates[styleName] = '';
    //       }
    //     }
    //     this._previousStyleCopy = null;
    //   }
    // }
    // for (propKey in nextProps) {
    //   if (propKey.hasOwnProperty(propKey)) {
    //     const nextProp = nextProps[propKey];
    //     const lastProp =
    //       propKey === 'style'
    //         ? this._previousStyleCopy
    //         : lastProps != null
    //         ? lastProps[propKey]
    //         : undefined;
    //     if (
    //       !nextProps.hasOwnProperty(propKey) ||
    //       nextProp === lastProp ||
    //       (nextProp == null && lastProp == null)
    //     ) {
    //       continue;
    //     }
    //     if (propKey === 'style') {
    //       if (nextProp) {
    //         nextProp = this._previousStyleCopy = { ...nextProp };
    //       } else {
    //         this._previousStyleCopy = null;
    //       }
    //     }
    //   }
    // }
  }

  getPublicInstance() {
    return getNode(this);
  }
}
