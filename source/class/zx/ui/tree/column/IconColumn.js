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

qx.Class.define("zx.ui.tree.column.IconColumn", {
  extend: zx.ui.tree.column.Column,

  properties: {
    options: {
      init: null,
      nullable: true,
      event: "changeOptions"
    }
  },

  members: {
    /*
     * @Override
     */
    createDisplayWidget: function (row) {
      if (row.isHeader())
        return new qx.ui.basic.Label().set({
          rich: true,
          appearance: "tree-column-cell"
        });
      return new qx.ui.basic.Image();
    },

    /*
     * @Override
     */
    _updateDisplayWidgetValueImpl: function (widget, model, row, value) {
      if (row.isHeader()) widget.setValue("");
      else widget.setSource(value ? value : "");
    }
  }
});
