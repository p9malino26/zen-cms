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


qx.Class.define("zx.cms.util.Error", {
  extend: qx.core.Object,

  construct(msg, obj) {
    throw new Error(
      "Do not create instances of zx.cms.util.Error - please see zx.cms.util.Error.create"
    );
  },

  statics: {
    create(msg, obj) {
      let err = new Error(msg);
      if (typeof obj == "string") err.code = obj;
      else if (obj) {
        Object.keys(obj).forEach(key => (err[key] = obj[key]));
      }
      return err;
    }
  }
});
