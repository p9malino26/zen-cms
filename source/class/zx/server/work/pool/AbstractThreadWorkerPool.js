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
 * @template TWorker the type of worker e.g. node worker or web worker
 */
qx.Class.define("zx.server.work.pool.AbstractThreadWorkerPool", {
  extend: zx.server.work.AbstractWorkerPool,
  implement: [zx.server.work.IWorkerFactory],

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
    /**@type {Map<zx.server.work.api.WorkerClientApi, TWorker>} */
    __workerMap: null,

    /**
     * @abstract
     * Creates a new worker.
     *
     * @param {string} apiPath The path at which to mount the instance of zx.server.work.api.WorkerServerApi on the worker
     * @returns {Promise<TWorker> | TWorker}
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
     * @override
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
     * @override
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
