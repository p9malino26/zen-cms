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

qx.Class.define("zx.io.persistence.ObjectCaches", {
  extend: qx.core.Object,
  type: "singleton",

  construct() {
    this.base(arguments);
    this.__caches = {};
  },

  members: {
    __caches: null,

    addCache(cache) {
      this.__caches[cache.toHashCode()] = cache;
    },

    removeCache(cache) {
      delete this.__caches[cache.toHashCode()];
    },

    findObjectByUuid(uuid) {
      for (let key in this.__caches) {
        let obj = this.__caches[key].findObjectByUuid(uuid);
        if (obj) return obj;
      }

      return null;
    }
  }
});
