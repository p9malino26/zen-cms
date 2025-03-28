/* ************************************************************************
 *
 *  Zen [and the art of] CMS
 *
 *  https://zenesis.com
 *
 *  Copyright:
 *    2019-2025 Zenesis Ltd, https://www.zenesis.com
 *
 *  License:
 *    MIT (see LICENSE in project root)
 *
 *  Authors:
 *    John Spackman (john.spackman@zenesis.com, @johnspackman)
 *
 * ************************************************************************ */

/**
 * Provides a simple datasource that accesses arrays of JSON objects
 */
qx.Class.define("zx.reports.datasource.JsonDataSource", {
  extend: zx.reports.datasource.AbstractDataSource,

  construct(json) {
    super();
    if (!qx.lang.Type.isArray(json)) {
      throw new Error("Expected an array of JSON objects as a datasource");
    }
    this.__json = json;
  },

  members: {
    /** @type{Array} array of JSON objects */
    __json: null,

    /** @type{Integer} current index */
    __index: -1,

    /**
     * @Override
     */
    _nextImpl() {
      if (this.__index == this.__json.length - 1) {
        return false;
      }

      this.__index++;
      return true;
    },

    /**
     * @Override
     */
    current() {
      if (this.__index < 0 || this.__index > this.__json.length - 1) {
        return null;
      }
      return this.__json[this.__index];
    }
  }
});
