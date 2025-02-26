/**
 * Interface for a scheduler that can be polled for work and notify when work is completed.  This is
 * effectively the Server API for work schedulers.
 *
 * Every work item which is added to a queue is JSON and must comply with the following schema:
 * @typedef WorkJson
 * @property {String} uuid the work UUID
 * @property {String} classname the name of the class to instantiate to perform the work
 *
 */
qx.Interface.define("zx.server.work.scheduler.ISchedulerApi", {
  events: {
    /** Fired when a work item is completed, the data is the serialized JSON from `WorkResult.serializeForScheduler` */
    workCompleted: "qx.event.type.Data"
  },

  members: {
    /**
     * Polls the queue for work to do.  If there is work to do, it is removed from the queue
     *
     * @return {WorkJson?} the work to do, or null if there is no work
     */
    pollForWork() {},

    /**
     * Called when work is completed.  This should be called by the worker pool when work is completed.
     *
     * @param {*} workResult the result of the work, serialized to JSON via `zx.server.work.WorkResult.serializeForScheduler()`
     */
    onWorkCompleted(workResult) {}
  }
});
