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
 * Provides a simple datasource that accesses a remote zx.reports.server.Cursor
 */
qx.Class.define("zx.reports.datasource.CursorDataSource", {
  extend: zx.reports.datasource.AbstractDataSource,

  /**
   * Constructor
   *
   * @param {zx.reports.server.Cursor} cursor
   */
  construct(cursor) {
    super();
    this.__cursor = cursor;
  },

  members: {
    /** @type{zx.reports.server.Cursor} remote cursor */
    __cursor: null,

    /** @type{Object} the current row object */
    __data: undefined,

    /**
     * @Override
     */
    async _nextImpl() {
      if (this.__data === null) {
        return false;
      }

      this.__data = await this.__cursor.next();
      return this.__data !== null;
    },

    /**
     * @Override
     */
    current() {
      return this.__data;
    }
  }
});
