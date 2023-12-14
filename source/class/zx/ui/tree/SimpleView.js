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

qx.Class.define("zx.ui.tree.SimpleView", {
  extend: zx.ui.tree.column.View,

  construct(labelPath, iconPath) {
    super();
    this.__column = new zx.ui.tree.column.AtomColumn().set({
      editable: false,
      width: "*"
    });

    this.getColumns().push(this.__column);
    this.setLabelPath(labelPath || "label");
    if (iconPath) {
      this.setIconPath(iconPath);
    }
  },

  properties: {
    labelPath: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeLabelPath",
      apply: "_applyLabelPath"
    },

    iconPath: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeIconPath",
      apply: "_applyIconPath"
    }
  },

  members: {
    __column: null,

    _applyOptions(value, oldValue) {
      this.__column.setOptions(value);
    },

    _applyLabelPath(value, oldValue) {
      this.__column.setValuePath(value);
    },

    _applyIconPath(value, oldValue) {
      this.__column.setIconPath(value);
    }
  }
});
