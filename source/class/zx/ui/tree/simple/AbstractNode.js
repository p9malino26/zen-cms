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

qx.Class.define("zx.ui.tree.simple.AbstractNode", {
  extend: qx.core.Object,

  construct: function (label, icon, model) {
    this.base(arguments);
    this._children = new qx.data.Array();
    if (label) this.setLabel(label);
    if (icon) this.setIcon(icon);
    if (model) this.setModel(model);
  },

  destruct: function () {
    this._disposeArray("_children");
  },

  properties: {
    parent: {
      init: null,
      nullable: true,
      check: "zx.ui.tree.simple.Node",
      apply: "_applyParent",
      event: "changeParent"
    },

    hasLoadedChildren: {
      init: true,
      nullable: false,
      check: "Boolean",
      event: "changeHasLoadedChildren",
      apply: "_applyHasLoadedChildren"
    },

    label: {
      init: "",
      nullable: false,
      check: "String",
      event: "changeLabel"
    },

    icon: {
      init: "",
      nullable: false,
      check: "String",
      event: "changeIcon"
    },

    model: {
      init: null,
      nullable: true,
      event: "changeModel",
      apply: "_applyModel"
    }
  },

  events: {
    /** Fired when this node needs to load it's children; after the eent has fired, the children are assumed
     * to have loaded
     */
    loadChildren: "qx.event.type.Event",

    /** Fired when the list of children changes; see qx.data.Array "change" event for definition of data */
    changeChildren: "qx.event.type.Data"
  },

  members: {
    __inLoadChildren: false,
    _children: null,

    getChildren: function () {
      this.checkChildrenLoaded();
      return this._children;
    },

    checkChildrenLoaded: function () {
      if (this.__inLoadChildren) return;
      this.__inLoadChildren = true;
      try {
        if (!this.getHasLoadedChildren()) {
          this._loadChildren();
        }
      } catch (ex) {
        throw ex;
      } finally {
        this.__inLoadChildren = false;
      }
    },

    _loadChildren: function () {
      this.fireEvent("loadChildren");
      this.setHasLoadedChildren(true);
    },

    _applyHasLoadedChildren: function (value) {
      /*
			 * whats the purpose of this??
			if (!value && this.getModel() && this.getParent())
				this.getModel().fireDataEvent("changeNodeChildren", this.getParent());
				*/
    },

    _applyParent: function (value, oldValue) {
      if (oldValue) oldValue.getChildren().remove(this);
      if (value) {
        var peers = value.getChildren();
        if (!peers.contains(this)) peers.push(this);
      }
    },

    _applyModel: function (value, oldValue) {
      // Nothing
    }
  }
});
