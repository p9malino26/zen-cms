/* ************************************************************************
 *
 *  Zen [and the art of] CMS
 *
 *  https://zenesis.com
 *
 *  Copyright:
 *    2019-2022 Zenesis Ltd, https://www.zenesis.com
 *
 *  License:
 *    MIT (see LICENSE in project root)
 *
 *  Authors:
 *    Will Johnson (@willsterjohnson)
 *
 * ************************************************************************ */
const { Worker } = require("node:worker_threads");

/**
 * The node worker pool runs work in a node worker thread
 */
qx.Class.define("zx.server.work.pool.NodeWorkerPool", {
  extend: zx.server.work.pool.AbstractThreadWorkerPool,
  implement: [zx.server.work.IWorkerFactory],

  environment: {
    "zx.server.work.pool.NodeWorkerPool.remoteAppPath": "./compiled/source-node/demo-work-node-worker-service/index.js"
  },

  /**
   * @param {object} config - config for {@link zx.utils.Pool}
   * @param {string} [remoteAppPath] - the path on disk to the compiled entrypoint for the remote worker app. The app will likely extend {@link zx.server.work.runtime.NodeWorkerApp}. If not provided, defaults to the environment variable `zx.server.work.pool.NodeWorkerPool.remoteAppPath` (this environment variable defaults to the application named 'demo-work-node-worker-service' built in source mode)
   */
  construct(config, remoteAppPath) {
    super(config);
    this.__remoteAppPath = remoteAppPath ?? qx.core.Environment.get("zx.server.work.pool.NodeWorkerPool.remoteAppPath");
  },

  members: {
    /**
     * creates a new instance
     * @param {string} apiPath
     * @returns {Promise<zx.server.work.api.WorkerClientApi>}
     */
    async _createWorker(apiPath) {
      let nodeWorker = new Worker(this.__remoteAppPath, { name: apiPath, workerData: { apiPath } });
      nodeWorker.on("error", err => console.error(err));
      nodeWorker.on("exit", code => console.log(`Worker stopped with exit code ${code}`));
      return nodeWorker;
    },

    /**
     * @returns {zx.io.api.transport.nodeWorker.Client}
     */
    _createClientTransport() {
      return new zx.io.api.transport.nodeWorker.Client();
    }
  }
});
