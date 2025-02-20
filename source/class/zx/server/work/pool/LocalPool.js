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

/**
 * The local pool runs work in the same main thread as the pool
 */
qx.Class.define("zx.server.work.pool.LocalPool", {
  extend: zx.server.work.pool.AbstractWorkerPool,
  implement: [zx.server.work.IWorkerFactory],

  construct() {
    super();
    this.__workerMap = new Map();
    this.getQxObject("pool").setFactory(this);
  },

  members: {
    /**@type {Map<zx.server.work.api.WorkerClientApi, zx.server.work.api.WorkerServerApi>} */
    __workerMap: null,

    /**
     * @override
     */
    async create() {
      let apiPath = this._createPath("workerApi");

      let serverTransport = new zx.io.api.transport.loopback.LoopbackServerTransport();
      let clientTransport = new zx.io.api.transport.loopback.LoopbackClientTransport();

      serverTransport.connect(clientTransport);
      clientTransport.connect(serverTransport);

      let serverApi = new zx.server.work.api.WorkerServerApi(apiPath);
      let clientApi = new zx.server.work.api.WorkerClientApi(clientTransport, apiPath);

      this.__workerMap.set(clientApi, serverApi);

      await clientApi.subscribe("log", this._onLog.bind(this));
      await clientApi.subscribe("complete", this._onComplete.bind(this));

      return clientApi;
    },

    /**
     * @override
     */
    async destroy(client) {
      let server = this.__workerMap.get(client);
      server.dispose();
      this.__workerMap.delete(client);
      client.terminate();
      client.dispose();
    }
  }
});
