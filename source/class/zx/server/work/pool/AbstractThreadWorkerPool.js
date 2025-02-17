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

/**
 * The worker thread pool runs work in a worker thread
 */
qx.Class.define("zx.server.work.pool.AbstractThreadWorkerPool", {
  extend: zx.server.work.AbstractWorkerPool,

  /**
   * @param {object} config - config for {@link zx.utils.Pool}
   */
  construct(config) {
    super();
    this.__workerMap = new Map();
    this.setPoolConfig(config);
    this.getQxObject("pool").setFactory(this);
  },

  members: {
    /**@type {Map<zx.server.work.api.WorkerClientApi, import('node:worker_threads').Worker | Worker>} */
    __workerMap: null,

    /**
     * @abstract
     * @param {string} apiPath
     * @returns {Promise<zx.server.work.api.WorkerClientApi>}
     */
    async _createWorker(apiPath) {
      throw new Error(`Abstract method _createWorker of class ${this.classname} not implemented`);
    },

    /**
     * @abstract
     * @returns {zx.io.api.client.AbstractClientTransport}
     */
    _createClientTransport() {
      throw new Error(`Abstract method _createClientTransport of class ${this.classname} not implemented`);
    },

    /**
     * creates a new instance
     * @returns {Promise<zx.server.work.api.WorkerClientApi>}
     */
    async create() {
      let apiPath = this._createPath("workerApi");

      let workerThread = await this._createWorker(apiPath);

      let transport = this._createClientTransport();
      transport.connect(workerThread);

      let client = new zx.server.work.api.WorkerClientApi(transport, apiPath);

      this.__workerMap.set(client, workerThread);

      await client.subscribe("log", this._onLog.bind(this));
      await client.subscribe("complete", this._onComplete.bind(this));
      return client;
    },

    /**
     * Destroys an instance entirely
     * @param {zx.server.work.api.WorkerClientApi} client
     */
    async destroy(client) {
      let workerThread = this.__workerMap.get(client);
      await workerThread.terminate();

      this.__workerMap.delete(client);
      await client.unsubscribe("log");
      await client.unsubscribe("complete");
      client.dispose();
    }
  }
});
