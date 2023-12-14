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

qx.Class.define("zx.thin.ui.utils.Confirm", {
  extend: zx.thin.ui.utils.AbstractMessage,

  construct(message, caption, buttons) {
    super(message, caption, buttons || ["yes", "no"]);
  },

  properties: {
    /** Refine the caption */
    caption: {
      init: "Confirmation",
      refine: true
    }
  },

  statics: {
    async show(message, caption, buttons) {
      let dlg = new zx.thin.ui.utils.Confirm(message, caption, buttons);
      let result = await dlg.open();
      dlg.dispose();
      return result;
    }
  }
});
