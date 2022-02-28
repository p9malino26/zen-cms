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


qx.Class.define("zx.thin.ui.utils.Working", {
  extend: zx.thin.ui.utils.AbstractMessage,

  construct(message, caption, cancel) {
    this.base(
      arguments,
      message || "Working, please wait...",
      caption,
      cancel ? ["cancel"] : []
    );
  },

  properties: {
    /** Refine the caption */
    caption: {
      init: "Working",
      refine: true
    }
  },

  statics: {
    async show(message, caption, buttons) {
      let dlg = new zx.thin.ui.utils.Working(message, caption, buttons);
      let result = await dlg.open();
      dlg.dispose();
      return result;
    }
  }
});
