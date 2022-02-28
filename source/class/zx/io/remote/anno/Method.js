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


/**
 * Annotation used to indicate methods which can be called remotely
 */
qx.Class.define("zx.io.remote.anno.Method", {
  extend: qx.core.Object,

  properties: {
    withRequest: {
      init: false,
      check: "Boolean",
    },
  },

  statics: {
    /** Default settings for including a method in persistence */
    DEFAULT: null,

    /** Default settings for methods which have the request injected as the first parameter */
    WITH_REQUEST: null,
  },

  defer(statics) {
    statics.DEFAULT = new zx.io.remote.anno.Method();
    statics.WITH_REQUEST = new zx.io.remote.anno.Method().set({
      withRequest: true,
    });
  },
});
