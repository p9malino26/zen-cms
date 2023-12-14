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

qx.Class.define("zx.thin.ui.utils.WipTask", {
  extend: qx.core.Object,

  construct(message) {
    super();
    if (message) {
      this.setMessage(message);
    }
  },

  properties: {
    message: {
      check: "String",
      event: "changeMessage"
    },

    complete: {
      init: false,
      check: "Boolean",
      event: "changeComplete"
    }
  }
});
