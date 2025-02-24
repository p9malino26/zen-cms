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
 *    John Spackman (@johnspackman)
 *    Will Johnson (@willsterjohnsonatzenesis)
 *
 * ************************************************************************ */
const { Worker } = require("node:worker_threads");

/**
 * The node worker pool runs work in a node worker thread
 */
qx.Class.define("zx.server.work.pools.NodeThreadWorkerPool", {
  /** @template {import('node:worker_threads').Worker} TWorker */
  extend: zx.server.work.pools.WorkerPool,

  /**
   * @param {object} poolConfig - config for {@link zx.utils.Pool}
   * @param {string} [remoteAppPath] - the path on disk to the compiled entrypoint for the remote worker app.
   */
  construct(poolConfig, remoteAppPath) {
    super(poolConfig);
    this.__remoteAppPath = remoteAppPath;
  },

  members: {
    /**
     * @override
     */
    async createPoolableEntity() {
      let nodeThread = new Worker(this.__remoteAppPath, { name: apiPath, workerData: {} });

      let workerTracker = new zx.server.work.pools.NodeThreadWorkerTracker(this, nodeThread);
      await workerTracker.initialise();
      return workerTracker;
    },

    /**
     * @override
     */
    async destroyPoolableEntity(entity) {
      // Nothing
    }
  }
});
