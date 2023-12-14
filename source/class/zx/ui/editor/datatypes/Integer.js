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

qx.Class.define("zx.ui.editor.datatypes.Integer", {
  extend: qx.core.Object,
  implement: [zx.ui.editor.datatypes.IDataType],

  members: {
    /**
     * @Override
     */
    convertToTarget(value, model) {
      return "" + value;
    },

    /**
     * @Override
     */
    convertToModel(value) {
      let tmp = parseInt(value, 10);
      return isNaN(tmp) ? 0 : tmp;
    },

    /**
     * @Override
     */
    validate(value) {
      return isNaN(parseInt(value, 10)) ? "Please enter an integer" : null;
    }
  }
});
