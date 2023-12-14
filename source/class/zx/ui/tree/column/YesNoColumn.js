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

qx.Class.define("zx.ui.tree.column.YesNoColumn", {
  extend: zx.ui.tree.column.Column,

  members: {
    /*
     * @Override
     */
    getDisplayValue(model) {
      return this.getRawValue(model) ? "Yes" : "No";
    },

    compare(left, right) {
      left = this.getRawValue(left);
      right = this.getRawValue(right);
      return left === right ? 0 : left ? 1 : -1;
    }
  }
});
