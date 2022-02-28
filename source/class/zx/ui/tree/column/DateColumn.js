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

qx.Class.define("zx.ui.tree.column.DateColumn", {
  extend: zx.ui.tree.column.Column,

  properties: {
    dateFormat: {
      init: null,
      nullable: true,
      check: "qx.util.format.DateFormat"
    }
  },

  members: {
    getDisplayValue: function (model) {
      var dt = this.base(arguments, model);
      if (!dt) return "";
      if (qx.lang.Type.isNumber(dt)) dt = new Date(dt);
      var df =
        this.getDateFormat() || qx.util.format.DateFormat.getDateTimeInstance();
      return df.format(dt);
    },

    compare: function (left, right) {
      left = this.getRawValue(left);
      right = this.getRawValue(right);
      if (left instanceof Date) left = left.getTime();
      if (right instanceof Date) right = right.getTime();

      return left < right ? -1 : left > right ? 1 : 0;
    }
  }
});
