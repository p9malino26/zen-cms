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

qx.Interface.define("zx.ui.editor.datatypes.IDataType", {
  members: {
    /**
     * Converts from the model value to the widget editor
     *
     * @param value {*}
     * @param model {qx.core.Object}
     * @return {*}
     */
    convertToTarget(value, model) {},

    /**
     * Converts from the widget editor to the model value
     *
     * @param value {*}
     * @return {*}
     */
    convertToModel(value) {},

    /**
     * Called to validate the value before setting on the model
     *
     * @param {*} value
     * @param {qx.ui.core.Widget} widget
     * @return {String?} null if there is no error, else an error message
     */
    validate(value, widget) {
      return null;
    }
  }
});
