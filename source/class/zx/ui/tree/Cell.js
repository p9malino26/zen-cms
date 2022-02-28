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

qx.Class.define("zx.ui.tree.Cell", {
  extend: qx.core.Object,
  implement: [qx.core.IDisposable],

  construct: function (row, column, header) {
    this.base(arguments);
    this.__row = row;
    this.__column = column;
    this.setHeader(header);
  },

  destruct: function () {
    this.__disposeBindings();

    if (this.__displayWidget) {
      this.__displayWidget.dispose();
      this.__displayWidget = null;
    }
  },

  properties: {
    header: {
      init: false,
      nullable: false,
      check: "Boolean",
      event: "changeHeader"
    },

    model: {
      init: null,
      nullable: true,
      event: "changeModel",
      apply: "_applyModel"
    }
  },

  members: {
    __row: null,
    __column: null,
    __displayWidget: null,
    __editWidget: null,
    __bindings: undefined,

    startEditing: function () {
      this.__editWidget = this.__column.getEditWidget();
      if (this.__editWidget) {
        this.__displayWidget.setVisibility("excluded");
      }
      return this.__editWidget;
    },

    finishEditing: function () {
      if (!this.isEditing()) return;
      this.__displayWidget.setVisibility("visible");
      var editWidget = this.__editWidget;
      this.__editWidget = null;
      return editWidget;
    },

    isEditing: function () {
      return !!this.__editWidget;
    },

    getWidget: function () {
      return this.__editWidget || this.getDisplayWidget();
    },

    getRow: function () {
      return this.__row;
    },

    getColumn: function () {
      return this.__column;
    },

    getDisplayWidget: function () {
      if (!this.__displayWidget)
        this.__displayWidget = this._createDisplayWidget(this.__row);
      return this.__displayWidget;
    },

    _createDisplayWidget: function (row) {
      return this.__column.createDisplayWidget(row);
    },

    updateDisplayWidget: function () {
      this.__column.updateDisplayWidgetValue(
        this.getDisplayWidget(),
        this.getModel(),
        this
      );
    },

    __disposeBindings: function () {
      if (this.__bindings) {
        this.__column.disposeBindings(this.__bindings);
        this.__bindings = undefined;
      }
    },

    _applyModel: function (value, oldValue) {
      if (value && this.__bindings === undefined) {
        var t = this;
        this.__bindings = this.__column.createBindings();
        if (this.__bindings) {
          this.__bindings.forEach(function (binding) {
            binding.addListener("changeValue", t.updateDisplayWidget, t);
          });
        }
      }

      if (this.__bindings) {
        this.__bindings.forEach(function (binding) {
          binding.setModel(value);
        });
      }

      this.updateDisplayWidget();
    }
  }
});
