/**
 * Specialisation of block that updates accumulators on each change of group
 */
qx.Class.define("zx.reports.Group", {
  extend: zx.reports.Block,

  /**
   * Constructor
   *
   * @param {String[]} columnNames names of columns to group by
   */
  construct(columnNames) {
    super();
    this.__columnNames = columnNames || [];
    this.__accumulators = {};
  },

  properties: {
    /** The child which is executed for every row in this group */
    child: {
      check: "zx.reports.Block",
      apply: "_applyChild"
    }
  },

  members: {
    /** @type{String[]} Column names to group by */
    __columnNames: null,

    /** @type{Map<String,zx.reports.Accumulator>} accumulators */
    __accumulators: null,

    /**
     * Apply for `child`
     */
    _applyChild(value, oldValue) {
      if (oldValue) {
        if (oldValue.getParent() !== this) {
          throw new Error("Child has wrong parent");
        }
        oldValue.setParent(null);
      }
      if (value) {
        if (value.getParent() !== null) {
          throw new Error("Child has a parent already");
        }
        value.setParent(this);
      }
    },

    /**
     * Adds an accumulator
     *
     * @param {String} id
     * @param {zx.reports.Accumulator} acc
     */
    addAccumulator(acc) {
      this.__accumulators[id] = acc;
    },

    /**
     * Sets the accumulators in one go
     *
     * @param {zx.reports.Accumulator[]} accs
     */
    setAccumulators(accs) {
      this.__accumulators = {};
      for (let id in accs) {
        this.__accumulators[id] = accs[id];
      }
    },

    /**
     * @override
     */
    getAccumulator(id) {
      let acc = this.__accumulators[id];
      return acc || super.getAccumulator(id);
    },

    /**
     * @override
     */
    async _executeImpl(ds, result) {
      let values = this.getValues(ds);
      let pass;
      for (let id in this.__accumulators) {
        this.__accumulators[id].reset(ds);
      }
      await this._before(ds, result);
      for (pass = 0; ; pass++) {
        for (let id in this.__accumulators) {
          this.__accumulators[id].update(ds);
        }
        await this._render(this.getChild(), ds, result);
        let newValues = this.getValues(ds);
        let groupHasChanged = !qx.lang.Array.equals(values, newValues);
        if (groupHasChanged || ds.isAtEof()) {
          break;
        }
      }
      await this._after(ds, result);
    },

    /**
     * Returns an array of values for the column names
     *
     * @param {zx.reports.datasource.AbstractDataSource} ds
     * @returns {Object[]}
     */
    getValues(ds) {
      return this.__columnNames.map(name => ds.get(name));
    }
  }
});
