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

qx.Class.define("zx.ui.tree.column.TextColumn", {
  extend: zx.ui.tree.column.Column,

  members: {
    startEditing(model) {
      super.startEditing(model);
      var widget = this.getEditWidget();
      widget.setTextSelection(0);
    }
  }
});
