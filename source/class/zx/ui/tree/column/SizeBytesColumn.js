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

qx.Class.define("zx.ui.tree.column.SizeBytesColumn", {
  extend: zx.ui.tree.column.Column,

  members: {
    getDisplayValue(model) {
      var size = super.getDisplayValue(model);
      if (!size || isNaN(size) || !isFinite(size)) {
        return "0 bytes";
      }
      if (size > 1024 * 1024) {
        return (size / (1024 * 1024)).toFixed(2) + "Mb";
      }
      if (size > 1024) {
        return (size / 1024).toFixed(2) + "Kb";
      }
      return size + " bytes";
    }
  }
});
