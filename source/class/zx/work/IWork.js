/**
 * Represents a piece of work to be executed by an instance of zx.work.IWorker
 */
qx.Interface.define("zx.work.IWork", {
  members: {
    /**
     * Executes the work
     * @abstract
     * @param {zx.work.OutputClientApi} output - the output api
     * @returns {Promise<string | void> | string | void}
     */
    execute() {}
  }
});
