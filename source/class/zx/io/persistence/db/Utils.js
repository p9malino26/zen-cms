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
 * Helper methods
 */
qx.Class.define("zx.io.persistence.db.Utils", {
  extend: qx.core.Object,

  statics: {
    /**
     * Quick check to see if an objecrt matches a query; this is used for the really basic
     * find/findOne implementations in MemoryDatabase.  If you want something
     * smart, switch to NeDB or MongoDB implementations.
     */
    matchQuery(json, query) {
      for (let keys = Object.keys(query), i = 0; i < keys.length; i++) {
        let key = keys[i];
        let value = query[key];
        if (json[key] !== value) {
          return false;
        }
      }
      return true;
    }
  }
});
