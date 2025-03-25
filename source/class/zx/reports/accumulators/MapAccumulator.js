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

qx.Class.define("zx.reports.accumulators.MapAccumulator", {
  extend: qx.core.Object,
  implement: [zx.reports.accumulators.IAccumulator],

  construct(keyNames, valueNames) {
    super();
    this.__keyNames = keyNames;
    this.__valueNames = valueNames;
  },

  members: {
    /** @type{String[]} column names to store as keys */
    __keyNames: null,

    /** @type{String[]} column names to store as values */
    __valueNames: null,

    /** @type{Map<String,*>} data */
    __mapsByKeyName: null,

    /**
     * @override
     */
    reset(ds) {
      this.__mapsByKeyName = {};
    },

    /**
     * @override
     */
    update(ds) {
      let valueNames = this.__valueNames || ds.getValueNames();
      let values = valueNames.map(valueName => ds.get(valueName));
      this.__keyNames.forEach(keyName => {
        let key = ds.get(keyName);
        if (this.__mapsByKeyName[keyName] === undefined) {
          this.__mapsByKeyName[keyName] = {};
        }
        this.__mapsByKeyName[keyName][key] = values;
      });
    },

    /**
     * Returns the map for the key with a specific value
     *
     * @param {String} keyName
     * @param {*} value
     * @returns {Map<String,*>}
     */
    getMapFor(keyName, value) {
      let map = this.__mapsByKeyName[keyName][value];
      if (map === undefined) {
        return null;
      }
      return map;
    }
  }
});
