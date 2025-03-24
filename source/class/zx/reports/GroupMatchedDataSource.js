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

qx.Class.define("zx.reports.GroupMatchedDataSource", {
  extend: zx.reports.datasource.AbstractDataSource,

  /**
   * Constructor
   *
   * @param {zx.reports.Group} group
   * @param {zx.reports.datasource.AbstractDataSource} ds
   */
  construct(group, ds) {
    super();
    this.__group = group;
    this.__ds = ds;
  },

  members: {
    /** @type{zx.reports.Group} the group that we have to follow */
    __group: null,

    /** @type{zx.reports.datasource.AbstractDataSource} the underlying data source */
    __ds: null,

    /** @type{*[]} values from the group that we have to match */
    __values: null,

    /**
     * @override
     */
    _openImpl() {
      this.__values = this.__group.getValues(this.__ds);
    },

    /**
     * @override
     */
    _closeImpl() {
      this.__values = null;
    },

    /**
     * @override
     */
    _nextImpl() {
      let values = this.__group.getValues(this.__ds);
      if (!qx.lang.Array.equals(values, this.__values)) {
        return false;
      }
      return true;
    },

    /**
     * @override
     */
    get(columnName) {
      return this.__ds.get(columnName);
    }
  }
});
