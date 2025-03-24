/**
 * Accumulators accumulate some value during execution; eg an accumulator attached to a group
 * will be reset at the start of the group and updated for every row of the group - EG this
 * is how a subtotal would be implemented
 */
qx.Interface.define("zx.reports.accumulators.IAccumulator", {
  members: {
    /**
     * Called to reset the accumulator
     *
     * @param {zx.reports.datasource.AbstractDataSource} ds
     */
    reset(ds) {},

    /**
     * Called to update the accumulator
     *
     * @param {zx.reports.datasource.AbstractDataSource} ds
     */
    update(ds) {}
  }
});
