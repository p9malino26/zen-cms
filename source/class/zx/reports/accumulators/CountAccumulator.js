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
