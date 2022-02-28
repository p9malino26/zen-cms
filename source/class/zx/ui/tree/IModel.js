/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2022 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */

qx.Interface.define("zx.ui.tree.IModel", {
  events: {
    /** Fired when a node's children changes */
    changeNodeChildren: "qx.event.type.Data"
  },

  members: {
    /**
     * Called to provide the children for a node
     * @param parent null is the root node
     * @return {Node[]}
     */
    getChildren: function (parent) {},

    /**
     * Detects whether the node has any children
     * @param parent {Node}
     * @param loadOnDemand {Boolean?} whether to load children on demand
     * @return ["yes", "no", "maybe"]
     */
    hasChildren: function (parent) {},

    /**
     * Returns a promise which will complete when the node has loaded all children
     * @return {qx.Promise}
     */
    promiseGetChildren: function (parent) {},

    /**
     * Gets the parent node of a node
     * @param node {Node} the node to get the parent of
     * @return {Node} the parent node, or null if node was the root
     */
    getParent: function (node) {},

    /**
     * Called to move/add a node
     * @param node
     * @param parentNode
     * @param insertAfter
     */
    moveTo: function (node, parentNode, insertAfter) {},

    /**
     * Called to find oput whether a node can be placed
     * @param node
     * @param parentNode
     * @param insertAfter
     * @return true/false
     */
    canMoveTo: function (node, parentNode, insertAfter) {}
  }
});
