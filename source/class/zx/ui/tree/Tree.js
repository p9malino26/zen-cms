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

qx.Class.define("zx.ui.tree.Tree", {
  extend: qx.ui.core.Widget,

  construct: function () {
    this.base(arguments);
    this.__rows = [];
    this.__rowMap = {};
    this.initSelection(new qx.data.Array());
    this.initChecked(new qx.data.Array());
    this._setLayout(new zx.ui.tree.TreeLayout());

    this.bind(
      "view.columns",
      new zx.utils.TargetArray(this.__onColumnsChange, this),
      "value"
    );

    this.addListener("contextmenu", this.__onContentMenu, this);
    this.addListener("mousedown", this.__onMouseDown, this);
    this.addListener("mouseup", this.__onMouseUp, this);
    this.addListener("dragstart", this.__onDragStart, this);
    this.addListener("droprequest", this.__onDropRequest, this);
    this.addListener("dragend", this.__onDragEnd, this);
    this.addListener("dragover", this.__onDragOver, this);
    this.addListener("dragleave", this.__onDragLeave, this);
    this.addListener("drop", this.__onDrop, this);
  },

  events: {
    /** Fired before selection changes, can be cancelled */
    beforeChangeSelection: "qx.event.type.Data",

    /** Fired when drag & drop has rearranged the nodes */
    nodesMoved: "qx.event.type.Data",

    /**
     * Fired by rows for click events; data is a map containing at
     * least:
     * type {String}
     * node {Node}
     */
    execute: "qx.event.type.Data",

    /**
     * Called to get the drag source; data is a map containing:
     * event: original drag event
     * apply: function to call with the drag source
     */
    getDragSource: "qx.event.type.Data",

    /**
     * Called to drop a new node; data is a map containing:
     * event: original drop event
     */
    dropNode: "qx.event.type.Data"
  },

  properties: {
    model: {
      check: "zx.ui.tree.IModel",
      init: null,
      nullable: true,
      apply: "_applyModel",
      event: "changeModel"
    },

    view: {
      check: "zx.ui.tree.IView",
      init: null,
      nullable: true,
      apply: "_applyView",
      event: "changeView"
    },

    indentWidth: {
      nullable: false,
      init: 19,
      themeable: true,
      apply: "_applyIndentWidth",
      event: "changeIndentWidth"
    },

    selection: {
      nullable: false,
      check: "qx.data.Array",
      apply: "_applySelection",
      transform: "_transformSelection",
      event: "changeSelection",
      deferredInit: true
    },

    selectionMode: {
      nullable: false,
      init: "single",
      check: ["single", "multi", "additive", "one"],
      apply: "_applySelectonMode",
      event: "changeSelectionMode"
    },

    checked: {
      check: "qx.data.Array",
      transform: "_transformChecked",
      apply: "_applyChecked",
      event: "changeChecked",
      deferredInit: true
    },

    showChecked: {
      init: false,
      check: "Boolean",
      apply: "_applyShowChecked",
      event: "changeChecked"
    },

    focusedNode: {
      nullable: true,
      init: null,
      apply: "_applyFocusedNode",
      event: "changeFocusedNode"
    },

    rightClickNode: {
      nullable: true,
      init: null,
      event: "changeRightClickNode"
    },

    readOnly: {
      init: false,
      nullable: false,
      check: "Boolean",
      event: "changeReadOnly"
    },

    appearance: {
      refine: true,
      init: "gtree"
    },

    droppable: {
      refine: true,
      init: true
    },

    dragType: {
      init: null,
      check: "String"
    }
  },

  members: {
    __rows: null,
    __rowMap: null,
    __rowPositions: null,
    __dropCaret: null,
    __reorgChildren: false,
    __mouseIsDown: false,
    __editingColumnIndex: -1,
    __editingRow: null,
    __inStartEditing: false,

    /**
     * Event handler for when the list of columns in the view changes
     */
    __onColumnsChange: function (data) {
      var t = this;
      data.removed.forEach(function (column) {
        column.removeListener("editorFinished", t.__onCellEditorFinished, t);
        column.removeListener("editorNext", t.__onCellEditorNext, t);
      });
      data.added.forEach(function (column) {
        column.addListener("editorFinished", t.__onCellEditorFinished, t);
        column.addListener("editorNext", t.__onCellEditorNext, t);
      });
    },

    /**
     * Event handler for when the editor of a cell says it's done (eg it looses focus)
     */
    __onCellEditorFinished: function (evt) {
      this.finishEditing();
    },

    /**
     * Event handler for when the editor of a cell needs to move to the next cell (eg the user presses tab)
     */
    __onCellEditorNext: function (evt) {
      var columnIndex = this.__editingColumnIndex;
      this.finishEditing();
      if (
        columnIndex > -1 &&
        columnIndex < this.getView().getColumns().getLength() - 1
      ) {
        var t = this;
        setTimeout(function () {
          t.startEditing(columnIndex + 1);
        }, 1);
      }
    },

    /**
     * Refreshes the display
     */
    refresh: function () {
      for (var i = 0; i < this.__rows.length; i++) {
        var row = this.__rows[i];
        if (row.isOpened()) {
          var node = this.__rows[i].getNode();
          if (node) this.expandNode(node);
        }
      }
      this.expandNode(this.getModel().getModel());
    },

    /**
     * Starts editing the current row
     */
    startEditing: function (columnIndex) {
      if (this.isReadOnly()) return;
      if (this.__inStartEditing) return;
      this.__inStartEditing = true;
      try {
        this.__finishEditingImpl();

        var sel = this.getSelection();
        var node = sel.getItem(0);
        var row = this.getRowFromNode(node);
        if (row && columnIndex !== null && columnIndex > -1)
          this.__startEditingImpl(row, columnIndex);
      } finally {
        this.__inStartEditing = false;
      }
    },

    /**
     * Implementation to start editing
     */
    __startEditingImpl: function (row, columnIndex) {
      var column = this.getView().getColumns().getItem(columnIndex);
      var node = row.getNode();
      if (!column.isEditable()) return false;
      if (!this.getView().startEditing(node, column)) return false;

      if (!row.startEditing(columnIndex)) return false;
      this.__editingRow = row;
      this.__editingColumnIndex = columnIndex;
      column.startEditing(node);
      return true;
    },

    /**
     * Stops editing
     */
    finishEditing: function () {
      if (this.__inStartEditing) return;
      if (this.__editingRow) {
        this.__finishEditingImpl();
      }
    },

    /**
     * Implementation to stop editing
     */
    __finishEditingImpl: function () {
      if (this.__editingRow) {
        var column = this.getView()
          .getColumns()
          .getItem(this.__editingColumnIndex);
        var node = this.__editingRow.getNode();
        column.finishEditing(node);
        this.getView().finishEditing(node, column);
        this.__editingRow.finishEditing(this.__editingColumnIndex);
      }

      this.__editingColumnIndex = -1;
      this.__editingRow = null;
    },

    /**
     * Recursively expands all nodes
     */
    expandAll: function () {
      for (var i = 0; i < this.__rows.length; i++) {
        var node = this.__rows[i].getNode();
        if (node) this.expandNode(node);
      }
    },

    /**
     * Expands the node, making it visible first if necessary, and refreshing it's children
     */
    expandNode: function (node) {
      var row = this.getRowFromNode(node);
      if (row == null && node != null) {
        let tmp = this.getModel().getParent(node);
        if (tmp == null) {
          this.warn("Cannot expand node because it is not in the model");
          return;
        }
        this.expandNode(tmp);
        row = this.getRowFromNode(node);
        qx.core.Assert.assertTrue(!!row);
      }
      var rows = this.__rows;
      var rowIndex = rows.indexOf(row);
      var indent = !row ? -1 : row.getIndent();
      var children = this.getModel().getChildren(node) || [];
      var childIndex = 0;

      /*
       * Takes the row at the rowIndex and all of it's children and pushes them into the
       * displaced object to be reinserted later
       */
      var displaced = {};
      function displace() {
        var row = rows[rowIndex];
        var indent = row.getIndent();
        var node = row.getNode();
        var data = (displaced[node.toHashCode()] = {
          node: node,
          rows: [row]
        });

        this.__rows.splice(rowIndex, 1);
        while (rowIndex < rows.length) {
          row = rows[rowIndex];
          if (row == this.__dropCaret) {
            rowIndex++;
            continue;
          }
          if (row.getIndent() > indent) {
            data.rows.push(row);
            this.__rows.splice(rowIndex, 1);
          } else break;
        }
      }

      var nextIndent =
        rowIndex == rows.length - 1 ? -1 : rows[rowIndex + 1].getIndent();
      if (nextIndent <= indent) {
        rowIndex++;
      } else {
        for (rowIndex++; rowIndex < rows.length; rowIndex++) {
          var cr = rows[rowIndex];
          var curIndent = cr.getIndent();
          nextIndent =
            rowIndex == rows.length - 1 ? -1 : rows[rowIndex + 1].getIndent();
          if (cr == this.__dropCaret) {
            // If the caret is the last of this branch of the tree, then
            // we should have
            // broken out last time around
            if (nextIndent <= indent) break;
            continue;
          }
          cr.setHasChildren(this.getModel().hasChildren(cr.getNode()) !== "no");

          // Grandchildren? then skip
          if (indent + 1 < curIndent) continue;

          // Child?
          if (indent + 1 == curIndent) {
            if (childIndex >= children.length) {
              this._removeRow(cr);
              while (rowIndex < rows.length) {
                cr = rows[rowIndex];
                if (cr.getIndent() > curIndent) this._removeRow(cr);
                else break;
              }
              rowIndex--;
            } else if (cr.getNode() == children[childIndex]) {
              childIndex++;
            } else {
              displace.call(this);
              rowIndex--;
            }
            nextIndent =
              rowIndex == rows.length - 1 ? -1 : rows[rowIndex + 1].getIndent();
            if (nextIndent <= indent) {
              rowIndex++;
              break;
            }
            continue;
          }

          // End of children
          if (nextIndent <= indent) {
            rowIndex++;
            break;
          }
        }
      }

      // End of children
      if (rowIndex > rows.length - 1 || nextIndent <= indent) {
        var insertBefore;
        if (rowIndex > rows.length - 1) insertBefore = null;
        else insertBefore = rows[rowIndex];
        while (childIndex < children.length) {
          var childNode = children[childIndex++];
          var data = displaced[childNode.toHashCode()];
          if (data) {
            if (rowIndex > rows.length - 1)
              this.__rows.push.apply(this.__rows, data.rows);
            else {
              var args = [rowIndex, 0].concat(data.rows);
              this.__rows.splice.apply(this.__rows, args);
            }
            rowIndex += data.rows.length;
            delete displaced[childNode.toHashCode()];
          } else {
            var newRow = this._createRow(childNode, row);
            this._addRow(newRow, insertBefore);
          }
        }
      }

      for (var hash in displaced) {
        var data = displaced[hash];
        for (var i = 0; i < data.rows.length; i++)
          this._removeRow(data.rows[i]);
      }

      if (row) {
        /* Setting hasChildren=true here causes the arrow to appear if it does not really have children;
         * this should be set according to whether the row _can_ be expanded, not _whether_ it is expanded
         */
        row.set({
          opened: true,
          hasChildren: this.getModel().hasChildren(row.getNode()) !== "no"
        });
      }
      this.__redraw();
    },

    /**
     * Forces the rows to be redrawn
     */
    __redraw: function () {
      this.__rows.forEach(function (row) {
        row.invalidateLayoutCache();
      });
      this.scheduleLayoutUpdate();
    },

    /**
     * Collapses the node recursively
     */
    collapseNode: function (node) {
      var row = this.getRowFromNode(node);
      var rows = this.__rows;
      var rowIndex = rows.indexOf(row);
      var indent = row.getIndent();
      rowIndex++;
      while (rowIndex < rows.length) {
        var cr = rows[rowIndex],
          curIndent = cr.getIndent();

        if (curIndent <= indent) break;
        this._removeRow(cr);
      }

      row.setOpened(false);
    },

    /**
     * Makes sure that a node is visible
     */
    showNode: function (node) {
      var chain = [];
      var model = this.getModel();
      while (node) {
        chain.push(node);
        node = model.getParent(node);
      }
      for (var i = chain.length - 1; i >= 0; i--) this.expandNode(chain[i]);
    },

    /**
     * Returns the row for a node
     */
    getRowFromNode: function (node) {
      return !node ? null : this.__rowMap[node.toHashCode()] || null;
    },

    /**
     * Returns all rows
     */
    getRows: function () {
      return this.__rows;
    },

    /**
     * Returns the drop caret node
     */
    getDropCaret: function () {
      return this.__dropCaret;
    },

    /**
     * Performs a full refresh of the tree
     */
    reloadAllRows: function () {
      this._removeAllRows();
      this._loadAllRows();
    },

    /**
     * Removes all of the rows
     */
    _removeAllRows: function () {
      if (!this.__rows.length) return;
      var rows = this.__rows;
      while (rows.length) this._removeRow(rows[0]);
      this.__rows = [];
      this.getSelection().removeAll();
      this.__redraw();
    },

    /**
     * Loads the rows
     */
    _loadAllRows: function () {
      if (this.__rows.length) return;

      var model = this.getModel();
      var nodes = model.getChildren(null) || [];
      for (var i = 0; i < nodes.length; i++) {
        var row = this._createRow(nodes[i], null);
        this._addRow(row);
      }
      if (this.getSelectionMode() == "one" && nodes.length) {
        var sel = this.getSelection();
        sel.splice(0, sel.getLength(), this.__rows[0].getNode());
      }
      this.__redraw();
    },

    /**
     * Factory method to create a new row
     */
    _createRow: function (node, parentRow) {
      var row = this.getView().createRow(node);
      this.__rowMap[node.toHashCode()] = row;
      row.set({
        node: node,
        parentRow: parentRow,
        indent: parentRow ? parentRow.getIndent() + 1 : 0,
        hasChildren: this.getModel().hasChildren(node) !== "no",
        selected: this.getSelection().indexOf(node) > -1,
        checked: this.getChecked().indexOf(node) > -1,
        showChecked: this.getShowChecked()
      });
      row.addListener("changeChecked", this.__onRowChangeChecked, this);
      return row;
    },

    /**
     * Event handler for changes to the checked property of rows
     */
    __onRowChangeChecked: function (evt) {
      var row = evt.getTarget();
      var node = row.getNode();
      var checked = this.getChecked();
      if (evt.getData()) {
        if (!checked.contains(node)) checked.push(node);
      } else {
        checked.remove(node);
      }
    },

    /**
     * Adds a new row
     */
    _addRow: function (row, before) {
      if (before) qx.lang.Array.insertBefore(this.__rows, row, before);
      else this.__rows.push(row);
      if (row != this.__dropCaret && row.getNode())
        this.__rowMap[row.getNode().toHashCode()] = row;
      if (before) this._addBefore(row, before);
      else this._add(row);
      this.__rowPositions = null;
    },

    /**
     * Removes a row
     */
    _removeRow: function (row) {
      var node = row.getNode();
      if (this.getFocusedNode() == node) this.setFocusedNode(null);
      if (node) {
        row.setNode(null);
        if (row != this.__dropCaret) delete this.__rowMap[node.toHashCode()];
      }
      qx.lang.Array.remove(this.__rows, row);
      this._remove(row);
      this.__rowPositions = null;
    },

    /**
     * Resets the selection
     */
    _resetSelection: function () {
      var sel = this.getSelection();
      for (var i = 0, rows = this.__rows; i < rows.length; i++)
        rows[i].setSelected(sel.contains(rows[i].getNode()));
    },

    /**
     * Replaces the selection
     */
    replaceSelection: function (arr) {
      arr = qx.lang.Array.toNativeArray(arr);
      var sel = this.getSelection();
      arr.unshift(sel.getLength());
      arr.unshift(0);
      sel.splice.apply(sel, arr);
    },

    /**
     * Resets the list of checked rows
     */
    _resetChecked: function () {
      var sel = this.getChecked();
      for (var i = 0, rows = this.__rows; i < rows.length; i++)
        rows[i].setChecked(sel.contains(rows[i].getNode()));
    },

    /**
     * Find the row for the event, eg the row that was clicked by searching teh widget
     * heirarchy
     */
    _getRowFromEvent: function (evt) {
      var target = evt.getTarget();
      while (target && target != this) {
        if (qx.Class.isSubClassOf(target.constructor, zx.ui.tree.Row))
          return target;
        target = target.getLayoutParent();
      }
      return null;
    },

    /**
     * Finds the row at a given x,y
     */
    _getRowFromPosition: function (clientX, clientY) {
      this._getRowPositions();
      var rows = this.__rows;
      for (var i = 0; i < rows.length; i++) {
        var pos = this._getRowPosition(i);
        if (pos) {
          if (clientY >= pos.top && clientY <= pos.bottom) return rows[i];
          if (clientY <= pos.bottom) return i ? rows[i - 1] : null;
        }
      }
      return null;
    },

    _getRowPositions: function () {
      if (!this._rowPositions) {
        var rows = this.__rows,
          rowPositions = (this.__rowPositions = []),
          pos = this.getContentLocation();

        for (var i = 0; i < rows.length; i++) {
          var rpos = rows[i].getContentLocation();
          if (rpos) {
            rpos.top -= pos.top;
            rpos.bottom -= pos.top;
            rpos.left -= pos.left;
            rpos.right -= pos.left;
          }
          rowPositions.push(rpos);
        }
      }
      return this.__rowPositions;
    },

    _getRowPosition: function (index) {
      this._getRowPositions();
      var rpos = this.__rowPositions[index];
      if (!rpos) {
        rpos = this.__rows[index].getContentLocation();
        if (rpos) {
          var pos = this.getContentLocation();
          rpos.top -= pos.top;
          rpos.bottom -= pos.top;
          rpos.left -= pos.left;
          rpos.right -= pos.left;
          this.__rowPositions[index] = rpos;
        }
      }
      return rpos;
    },

    __caretOff: function () {
      if (this.__dropCaret) {
        var index = this.__rows.indexOf(this.__dropCaret);
        if (index > -1) {
          this._removeRow(this.__dropCaret);
        }
      }
    },

    __caretOn: function (index, node) {
      if (!this.__dropCaret)
        this.__dropCaret = this.getView().createDropCaretRow(this);
      var curIndex = this.__rows.indexOf(this.__dropCaret);
      if (index != -1 && curIndex == index) return;
      if (curIndex > -1) {
        this._removeRow(this.__dropCaret);
        if (curIndex < index) index--;
      }
      this.__dropCaret.setNode(node);
      this._addRow(this.__dropCaret, index < -1 ? null : this.__rows[index]);
    },

    __onContentMenu: function (evt) {
      var row = this._getRowFromEvent(evt);
      this.setRightClickNode(row ? row.getNode() : null);
    },

    __onMouseDown: function (evt) {
      this.debug("__onMouseDown: 1");
      var row = this._getRowFromEvent(evt);
      var columnIndex = row ? row.getWidgetColumn(evt.getTarget()) : null;
      if (
        row &&
        row == this.__editingRow &&
        columnIndex == this.__editingColumnIndex
      ) {
        this.__debugDrag(
          "mouse down: already editing " + columnIndex + ", row=" + row
        );
      } else {
        this.__debugDrag(
          "mouse down: columnIndex=" + columnIndex + ", row=" + row
        );
        this.__mouseIsDown = true;
      }
      this.debug(
        "__onMouseDown: 2: editingRow=" +
          this.__editingRow +
          ", editingColumn=" +
          this.__editingColumnIndex
      );
    },

    __onMouseUp: function (evt) {
      if (!this.__mouseIsDown) return;
      this.__mouseIsDown = false;
      var row = this._getRowFromEvent(evt);
      if (!row) return;
      if (evt.getButton() != "left") return;

      this.__debugDrag("__onMouseUp: 1");

      var arrow = row.getChildControl("arrow");
      var columnIndex = row.getWidgetColumn(evt.getTarget());
      if (columnIndex === -1) {
        if (row.getOpened()) this.collapseNode(row.getNode());
        else this.expandNode(row.getNode());
        return;
      }

      var mode = this.getSelectionMode();
      var sel = this.getSelection().toArray().slice(0);
      var node = row.getNode();

      if (mode == "one") {
        if (!row.getSelected()) sel.splice(0, sel.length, node);
      } else if (mode == "single") {
        sel = [node];
      } else if (mode == "additive") {
        if (row.getSelected()) sel.splice(sel.indexOf(node), 1);
        else sel.push(node);
      } else {
        if (evt.isShiftPressed()) {
          var startNode = this.getFocusedNode() || (sel.length && sel[0]);
          if (!startNode) sel.push(node);
          else {
            var startRow = this.getRowFromNode(this.getFocusedNode() || sel[0]),
              startIndex = this.__rows.indexOf(startRow);
            var endIndex = this.__rows.indexOf(row);
            if (endIndex < startIndex) {
              var tmp = startIndex;
              startIndex = endIndex;
              endIndex = tmp;
            }
            sel = [];
            for (var i = startIndex; i <= endIndex; i++)
              sel.push(this.__rows[i].getNode());
          }
        } else if (sel.length == 0) sel.push(node);
        else if (evt.isCtrlOrCommandPressed()) {
          if (row.getSelected()) sel.splice(sel.indexOf(node), 1);
          else sel.push(node);
        } else {
          if (sel.length && row.getSelected()) sel = [];
          else sel.splice(0, sel.length, node);
        }
      }

      var tmp = this.getSelection();
      var same = qx.lang.Array.equals(tmp, sel);
      if (!same) {
        if (
          this.fireDataEvent("beforeChangeSelection", sel, tmp.toArray(), true)
        ) {
          tmp.splice.apply(tmp, [0, tmp.getLength()].concat(sel));
          this.setFocusedNode(node);
        }
        this.debug(
          "__onMouseUp: 2: columnIndex=" +
            columnIndex +
            ", editingColumn=" +
            this.__editingColumnIndex +
            ", editingRow=" +
            this.__editingRow
        );
        if (columnIndex !== null) this.startEditing(columnIndex);
      } else if (columnIndex !== null && sel.length == 1) {
        this.debug(
          "__onMouseUp: 3: columnIndex=" +
            columnIndex +
            ", editingColumn=" +
            this.__editingColumnIndex +
            ", editingRow=" +
            this.__editingRow
        );
        this.startEditing(columnIndex);
      }
    },

    _getDragSource: function (evt) {
      var source = evt.getRelatedTarget();
      var result = null;
      if (source instanceof zx.ui.tree.Row) result = source.getNode();

      this.fireDataEvent("getDragSource", {
        event: evt,
        apply: function (value) {
          result = value;
        }
      });

      return result;
    },

    _dropNode: function (parentNode, insertAfter, evt) {
      var self = this;
      return evt.getCurrentActionAsync().then(function (action) {
        return !self.fireDataEvent(
          "dropNode",
          {
            parentNode: parentNode,
            insertAfter: insertAfter,
            action: action,
            event: evt
          },
          null,
          true
        );
      });
    },

    __dragSourceNode: null,
    __onDragOver: function (evt) {
      var pos = this.getContentLocation();
      var mouseLeft = evt.getDocumentLeft() - pos.left;
      var mouseTop = evt.getDocumentTop() - pos.top;
      var targetRow = this._getRowFromPosition(mouseLeft, mouseTop);
      var sourceNode = this._getDragSource(evt);

      if (!sourceNode) {
        evt.preventDefault();
        this.__debugDrag("dragover: refused because sourceNode = null");
        return;
      }
      this.__dragSourceNode = sourceNode;
      this.__debugDrag("dragover: " + sourceNode.classname);

      this.addListener("mousemove", this.__onMouseMoveDuringDrag, this, true);
      this.__blockDrop = false;
      this.__onMouseMoveDuringDrag(evt);
    },

    __onDragLeave: function (evt) {
      this.__debugDrag("dragleave");
      this.removeListener(
        "mousemove",
        this.__onMouseMoveDuringDrag,
        this,
        true
      );
      this.__caretOff();
    },

    __onMouseMoveDuringDrag: function (evt) {
      var pos = this.getContentLocation();
      var mouseLeft = evt.getDocumentLeft() - pos.left;
      var mouseTop = evt.getDocumentTop() - pos.top;
      var targetRow = this._getRowFromPosition(mouseLeft, mouseTop);
      var sourceNode = this.__dragSourceNode;
      var targetIndex = this.__rows.indexOf(targetRow);

      this.__debugDrag(
        "__onMouseMoveDuringDrag: " +
          sourceNode.classname +
          ", targetRow=" +
          targetRow +
          ", targetIndex=" +
          targetIndex +
          ", sourceNode=" +
          sourceNode
      );

      this.__caretOn(targetIndex, sourceNode);

      var model = this.getModel();
      var caretIndex = this.__rows.indexOf(this.__dropCaret);
      // if (caretIndex == 0) debugger;
      this.__dropCaret.setIndent(0);
      this.__blockDrop = false;
      if (caretIndex > 0) {
        var row = this.__rows[caretIndex - 1];
        while (row) {
          var contentPos = row.getContentBounds();
          var offset =
            this.getView().getDropIndentOffset() || row.getDropIndentOffset();
          this.__debugDrag(
            "caretIndex=" +
              caretIndex +
              ", row=" +
              row +
              ", row.indent=" +
              row.getIndent() +
              ", offset=" +
              offset
          );
          this.__debugDrag(
            "    mouseLeft=" +
              mouseLeft +
              ", contentPos.left=" +
              contentPos.left
          );

          if (mouseLeft > contentPos.left + offset) {
            if (model.canMoveTo(sourceNode, row.getNode(), null)) {
              this.__debugDrag(
                "    Allowing drop #1, indent=" + (row.getIndent() + 1)
              );
              this.__dropCaret.setIndent(row.getIndent() + 1);
              qx.ui.core.queue.Layout.flush();
              return;
            } else this.__debugDrag("    Can't drop as child");
          }

          if (
            mouseLeft >= contentPos.left &&
            mouseLeft <= contentPos.left + offset
          ) {
            if (
              model.canMoveTo(
                sourceNode,
                row.getParentRow() ? row.getParentRow().getNode() : null,
                row.getNode()
              )
            ) {
              this.__dropCaret.setIndent(row.getIndent());
              qx.ui.core.queue.Layout.flush();
              this.__debugDrag(
                "    Allowing drop #2, indent=" + row.getIndent()
              );
              return;
            }
          }
          row = row.getParentRow();
        }
        if (model.canMoveTo(sourceNode, null, null)) {
          this.__debugDrag("    Allowing drop, top level node");
          this.__dropCaret.setIndent(0);
          qx.ui.core.queue.Layout.flush();
        } else {
          this.__debugDrag("    blocking drop, caretIndex > 0");
          this.__blockDrop = true;
        }
      } else if (caretIndex == 0) {
        this.__debugDrag("caretIndex==0");
        if (!model.canMoveTo(sourceNode, null, null)) {
          this.__debugDrag("    blocking drop, caretIndex == 0");
          this.__blockDrop = true;
        } else {
          this.__dropCaret.setIndent(0);
          qx.ui.core.queue.Layout.flush();
        }
      }
      //qx.ui.core.queue.Manager.flush();
    },

    __onDragStart: function (evt) {
      if (this.isReadOnly() || !this.getDraggable() || !!this.__editingRow) {
        evt.preventDefault();
        return;
      }
      evt.addAction("move");
      var dragType = this.getDragType();
      if (dragType) {
        evt.addType(dragType);
        evt.addType(dragType + "[]");
      }
      this.__debugDrag("__onDragStart");
    },

    __onDropRequest: function (evt) {
      var reqType = evt.getCurrentType();
      var dragType = this.getDragType();
      var sel = this.getSelection();
      if (reqType == dragType) {
        evt.addData(reqType, sel.getItem(0));
      } else if (reqType == dragType + "[]") {
        evt.addData(reqType, sel);
      }
    },

    __onDragEnd: function (evt) {
      if (!this.getDraggable()) return;
      this.removeListener(
        "mousemove",
        this.__onMouseMoveDuringDrag,
        this,
        true
      );
      this.__debugDrag("__onDragEnd");
    },

    __onDrop: function (evt) {
      var t = this;
      if (this.isReadOnly()) {
        evt.preventDefault();
        return;
      }
      if (this.__blockDrop) {
        this.__debugDrag("drop: refused because __blockDrop == true");
        return;
      }

      if (!this.getDroppable()) return;

      this.__debugDrag("__onDrop");

      var rows = this.__rows;
      var model = this.getModel();

      // Find the caret and check it's indentation.
      var caretIndex = this.__rows.indexOf(this.__dropCaret);
      var dropParentNode = null;
      var dropInsertAfter = null;
      if (caretIndex == 0) this.__dropCaret.setIndent(0);
      else if (caretIndex == -1) {
        var tmp = rows[rows.length - 1];
        this.__dropCaret.setIndent(
          Math.min(tmp.getIndent() + 1, this.__dropCaret.getIndent())
        );
      } else {
        var tmp = rows[caretIndex - 1];
        this.__dropCaret.setIndent(
          Math.min(tmp.getIndent() + 1, this.__dropCaret.getIndent())
        );
        // Expand the node (must be done before we start removing nodes,
        // below)
        if (tmp.getIndent() < this.__dropCaret.getIndent()) {
          this.expandNode(tmp.getNode());
          dropParentNode = tmp.getNode();
          dropInsertAfter = null;
        } else {
          dropInsertAfter = tmp.getNode();
          dropParentNode = model.getParent(dropInsertAfter);
        }
      }

      var sourceRow = evt.getRelatedTarget();
      if (!sourceRow) return;

      var sourceIndex = this.__rows.indexOf(sourceRow);

      this.__reorgChildren = true;
      return model
        .promiseGetChildren(dropParentNode)
        .then(function () {
          return this._dropNode(dropParentNode, dropInsertAfter, evt);
        }, this)
        .then(function (dropNode) {
          try {
            if (dropNode || !(sourceRow instanceof zx.ui.tree.Row)) {
              this.__caretOff();
              return;
            }

            // Find what has to be moved, ie the row plus all rows for child
            // nodes
            var moved = [sourceRow];
            rows.splice(sourceIndex, 1);
            for (var i = sourceIndex; i < rows.length; i++) {
              var row = rows[i];
              if (row == this.__dropCaret) continue;
              if (row.getIndent() <= sourceRow.getIndent()) break;
              rows.splice(i, 1);
              i--;
              moved.push(row);
            }

            // Put the drop targets back in the array
            caretIndex = this.__rows.indexOf(this.__dropCaret);
            var args = [caretIndex, 0].concat(moved);
            rows.splice.apply(rows, args);
            caretIndex = this.__rows.indexOf(this.__dropCaret);

            // Adjust the indentation of the node and all child node rows
            var indent = this.__dropCaret.getIndent();
            var indentDiff = indent - sourceRow.getIndent();
            if (indentDiff != 0)
              for (var i = 0; i < moved.length; i++)
                moved[i].setIndent(moved[i].getIndent() + indentDiff);

            // If a tree is bisected, we need to make sure that the indent
            // does not jump
            // by more than one between the last row dropped and the next
            // row
            /*
           * commented this out because when dragging a top level branch into
           * part way down another top level branch, the branch being dropped
           * was flattened out 
          if (caretIndex > 0 && caretIndex < rows.length - 1) {
            var indent = rows[caretIndex - 1].getIndent();
            var indentDiff = rows[caretIndex + 1].getIndent() - indent;
            if (indentDiff > 1) {
              for (var rowIndex = caretIndex + 1; rowIndex < rows.length; rowIndex++) {
                var row = rows[rowIndex];
                if (row.getIndent() <= indent + 1)
                  break;
                row.setIndent(Math.max(indent + 1, row.getIndent() - indentDiff + 1));
              }
            }
          }
          */

            // Fix parent/child relationships in the model
            rowIndex = 0;
            var fixup = function (parentRow, indent) {
              var lastRow = parentRow;
              while (rowIndex < rows.length) {
                var row = rows[rowIndex];
                var rowIndent = row.getIndent();
                if (row == this.__dropCaret) {
                  rowIndex++;
                  continue;
                }

                if (rowIndent == indent) {
                  row.setParentRow(parentRow);
                  var insertAfter = lastRow;
                  if (lastRow && lastRow.getIndent() == indent - 1)
                    insertAfter = null;
                  else if (lastRow) insertAfter = lastRow.getNode();
                  model.moveTo(
                    row.getNode(),
                    parentRow ? parentRow.getNode() : null,
                    insertAfter
                  );
                  lastRow = row;
                } else if (rowIndent < indent) {
                  rowIndex--;
                  return;
                } else {
                  fixup(lastRow, indent + 1);
                }

                rowIndex++;
              }
            }.bind(this);

            fixup(null, 0);

            for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
              row = rows[rowIndex];
              if (row == this.__dropCaret) continue;
              var nextRow =
                rowIndex == rows.length - 1 ? null : rows[rowIndex + 1];
              if (nextRow == this.__dropCaret)
                nextRow =
                  rowIndex == rows.length - 2 ? null : rows[rowIndex + 2];

              var hasChildren = model.hasChildren(row.getNode(), true);
              row.setHasChildren(hasChildren !== "no");
              if (
                hasChildren === "no" ||
                !nextRow ||
                nextRow.getIndent() <= row.getIndent()
              )
                row.set({
                  opened: false
                });
              else
                row.set({
                  opened: true
                });
            }

            this.__rowPositions = null;
            this.__redraw();

            this.fireDataEvent("nodesMoved", moved);
          } catch (ex) {
            throw ex;
          } finally {
            this.__caretOff();
            this.__reorgChildren = false;
          }
        }, this);
    },

    __onNodeChangeChildren: function (evt) {
      if (this.__reorgChildren) return;
      var node = evt.getData();
      if (node && !this.getRowFromNode(node)) return;
      this.expandNode(node);
    },

    _applyIndentWidth: function (value, oldValue) {
      for (var rows = this.__rows, i = 0; i < rows.length; i++)
        rows[i].resetIndent();
    },

    _applyModel: function (value, oldValue) {
      if (oldValue)
        oldValue.removeListener(
          "changeNodeChildren",
          this.__onNodeChangeChildren,
          this
        );
      this._removeAllRows();
      if (value && this.getView()) this._loadAllRows();
      if (value)
        value.addListener(
          "changeNodeChildren",
          this.__onNodeChangeChildren,
          this
        );
    },

    _applyView: function (value, oldValue) {
      if (oldValue) {
        oldValue.setTree(null);
        oldValue.removeListener("change");
      }
      if (oldValue) this._removeAllRows();
      if (value) value.setTree(this);
      if (value && this.getModel()) this._loadAllRows();
    },

    _transformSelection: function (value, oldValue) {
      if (oldValue === undefined) return value;
      if (!value) oldValue.removeAll();
      else oldValue.replace(value);
      return oldValue;
    },

    _applySelection: function (value, oldValue) {
      if (oldValue)
        oldValue.removeListener("change", this._resetSelection, this);
      if (value) value.addListener("change", this._resetSelection, this);
      else this.debug("Unexpected NULL for selection");

      var rows = this.__rows;
      for (var i = 0; i < rows.length; i++) {
        rows[i].setSelected(value.contains(rows[i].getNode()));
      }
    },

    _applySelectonMode: function (value, oldValue) {
      var sel = this.getSelection();

      if (value == "one" && sel.getLength() == 0) {
        var node =
          this.getFocusedNode() ||
          (this.__rows.length && this.__rows[0].getNode());
        if (node) sel.push(node);
      } else if ((value == "single" || value == "one") && sel.getLength() > 0)
        sel.splice(0, sel.getLength() - 1);
    },

    _transformChecked: function (value) {
      if (!value) value = new qx.data.Array();
      return value;
    },

    _applyShowChecked: function (value, oldValue) {
      this.__rows.forEach(function (row) {
        row.setShowChecked(value);
      });
      this.invalidateLayoutCache();
      qx.ui.core.queue.Layout.add(this);
    },

    _applyChecked: function (value, oldValue) {
      if (oldValue) oldValue.removeListener("change", this._resetChecked, this);
      if (value) value.addListener("change", this._resetChecked, this);
      else this.debug("Unexpected NULL value for checked");

      var rows = this.__rows;
      for (var i = 0; i < rows.length; i++) {
        rows[i].setChecked(value.contains(rows[i].getNode()));
      }
    },

    _applyFocusedNode: function (value, oldValue) {
      if (oldValue) {
        var row = this.getRowFromNode(oldValue);
        if (row) row.setFocused(false);
      }
      if (value) {
        var row = this.getRowFromNode(value);
        if (row) row.setFocused(true);
      }
    },

    __debugDrag: function () {
      //this.debug.apply(this, arguments);
    }
  }
});
