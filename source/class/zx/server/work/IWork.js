/**
 * Represents a piece of work to be executed by an instance of zx.server.work.IWorker
 */
qx.Interface.define("zx.server.work.IWork", {
  members: {
    /**
     * Executes the work
     * @abstract
     * @param {zx.server.work.OutputClientApi} output - the output api
     * @returns {Promise<string | void> | string | void}
     */
    execute() {}
  }
});
