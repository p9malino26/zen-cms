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

qx.Class.define("zx.reports.accumulators.CountAccumulator", {
  extend: qx.core.Object,
  implement: [zx.reports.accumulators.IAccumulator],

  properties: {
    count: {
      init: 0,
      check: "Integer",
      event: "changeCount"
    }
  },

  members: {
    /**
     * @override
     */
    reset(ds) {
      this.setCount(0);
    },

    /**
     * @override
     */
    update(ds) {
      this.setCount(this.getCount() + 1);
    }
  }
});
