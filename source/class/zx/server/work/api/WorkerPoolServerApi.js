/**
 * This API provides a REST API for communicating with a worker pool
 * and getting status information about it.
 */
qx.Class.define("zx.server.work.api.WorkerPoolServerApi", {
  extend: zx.io.api.server.AbstractServerApi,

  /**
   * @param {zx.server.work.AbstractWorkerPool} pool
   */
  construct(pool) {
    super("zx.server.work.api.WorkerPoolApi");
    this.__pool = pool;

    this._registerGet("shutdown", () => this.__pool.shutdown());
    this._registerGet("kill/{uuid}", (req, res) => this.__pool.killWork(req.getPathArgs().uuid));
    this._registerGet("worker-status/{uuid}", (req, res) => this.__pool.getWorkerStatusJson(req.getPathArgs().uuid));
    this._registerGet("status", (req, res) => this.__pool.getStatusJson());
  },

  members: {
    /**
     * @type {zx.server.work.AbstractWorkerPool}
     */
    __pool: null
  }
});
