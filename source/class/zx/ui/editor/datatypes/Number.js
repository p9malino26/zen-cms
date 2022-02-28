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

qx.Class.define("zx.ui.editor.datatypes.Number", {
  extend: qx.core.Object,
  implement: [zx.ui.editor.datatypes.IDataType],

  members: {
    convertToTarget(value, model) {
      return "" + value;
    },

    convertToModel(value) {
      return parseFloat(value) || 0;
    },

    /**
     * @Override
     */
    validate(value) {
      return isNaN(parseFloat(value)) ? "Please enter a number" : null;
    }
  }
});
