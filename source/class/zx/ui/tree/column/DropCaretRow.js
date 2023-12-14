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

qx.Class.define("zx.ui.tree.column.DropCaretRow", {
  extend: zx.ui.tree.Row,

  properties: {
    appearance: {
      refine: true,
      init: "zx-ui-tree-dropcaret"
    }
  },

  members: {
    _createChildren() {
      this._add(this.getChildControl("indent"));
      this._add(this.getChildControl("arrow"));
    },

    toString() {
      return "Column Drop Caret";
    }
  }
});
