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

qx.Class.define("zx.thin.ui.utils.Alert", {
  extend: zx.thin.ui.utils.AbstractMessage,

  construct(message, caption) {
    super(message, caption, ["ok"]);
  },

  properties: {
    /** Refine the caption */
    caption: {
      init: "Information",
      refine: true
    }
  },

  statics: {
    async show(message, caption) {
      let dlg = new zx.thin.ui.utils.Alert(message, caption);
      await dlg.open();
      dlg.dispose();
    }
  }
});
