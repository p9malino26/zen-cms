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

qx.Class.define("zx.ui.tree.column.View", {
  extend: qx.core.Object,
  implement: [zx.ui.tree.IView],

  construct() {
    super();
    this.__columns = new qx.data.Array();
    this.__columns.addListener("change", this.__onColumnsChange, this);
  },

  properties: {
    /** Psuedo property
     * columns
     *
    columns: {
      nullable: false,
      check: "qx.data.Array",
      event: "changeColumns"
    }
    */

    tree: {
      nullable: false,
      check: "zx.ui.tree.Tree",
      apply: "_applyTree"
    },

    options: {
      init: null,
      nullable: true,
      event: "changeOptions"
    },

    rowClass: {
      init: zx.ui.tree.Row,
      nullable: false
    },

    rowAppearance: {
      init: null,
      nullable: true
    },

    layoutClass: {
      init: zx.ui.tree.RowLayout
    }
  },

  events: {
    changeColumns: "qx.event.type.Data",
    beforeEditCell: "qx.event.type.Data",
    afterEditCell: "qx.event.type.Data"
  },

  members: {
    __columns: null,

    /**
     * get for columns psuedo property
     */
    getColumns() {
      return this.__columns;
    },

    /**
     * set for columns psuedo property
     */
    setColumns(value) {
      this.__columns.replace(value ? value : []);
    },

    /**
     * reset for columns psuedo property
     */
    resetColumns() {
      this.__columns.removeAll();
    },

    /**
     * Returns the columns applicable for a specific row
     */
    getColumnsForRow(row) {
      return this.getColumns();
    },

    /**
     * Called to check if the cell can be edited
     */
    startEditing(node, column) {
      return this.fireDataEvent("beforeEditCell", { node: node, column: column }, null, true);
    },

    /**
     * Called when editing has finished
     */
    finishEditing(node, column) {
      this.fireDataEvent("afterEditCell", { node: node, column: column }, null);
    },

    /**
     * Event handler for changes to the columns
     */
    __onColumnsChange(evt) {
      var data = evt.getData();
      var t = this;

      data.added.forEach(function (col) {
        col.setController(t);
      });
      data.removed.forEach(function (col) {
        col.setController(null);
      });
    },

    /**
     * Apply for tree property
     */
    _applyTree(value, oldValue) {
      if (oldValue) {
        throw new Error("Cannot change value of " + this.classname + ".tree once set");
      }
    },

    /*
     * @Override
     */
    createRow(node) {
      var clz = this.getRowClass();
      var row = new clz(this.getTree());
      var app = this.getRowAppearance();
      if (app) {
        row.setAppearance(app);
      }
      var layout = row.getLayout();
      var clz = this.getLayoutClass();
      if (!(layout instanceof clz)) {
        row.setLayout(new clz());
      }

      return row;
    },

    /*
     * @Override
     */
    createDropCaretRow(tree) {
      return new zx.ui.tree.column.DropCaretRow(tree).set({ controller: this });
    },

    /*
     * @Override
     */
    applyContentNode(widget, node, oldNode, dropCaret) {
      if (!dropCaret) {
        throw new Error("Unexpected call to " + this.classname + ".applyContentNode");
      }
    },

    /*
     * @Override
     */
    getDropIndentOffset() {
      return null;
    }
  }
});
