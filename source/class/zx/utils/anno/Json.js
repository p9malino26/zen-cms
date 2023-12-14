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

qx.Class.define("zx.utils.anno.Json", {
  extend: qx.core.Object,

  properties: {
    public: {
      init: false,
      check: "Boolean"
    },

    refer: {
      init: false,
      check: "Boolean"
    }
  },

  statics: {
    PUBLIC: null,
    PUBLIC_REF: null
  },

  defer(statics) {
    statics.PUBLIC = new zx.utils.anno.Json().set({ public: true });
    statics.PUBLIC_REF = new zx.utils.anno.Json().set({
      public: true,
      refer: true
    });
  }
});
