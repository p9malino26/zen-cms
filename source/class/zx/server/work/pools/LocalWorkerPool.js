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
qx.Class.define("zx.server.work.pools.LocalWorkerPool", {
  extend: zx.server.work.pools.WorkerPool,

  members: {
    /**
     * @override
     */
    async createPoolableEntity() {
      let serverTransport = new zx.io.api.transport.loopback.LoopbackServerTransport();
      let clientTransport = new zx.io.api.transport.loopback.LoopbackClientTransport();

      serverTransport.connect(clientTransport);
      clientTransport.connect(serverTransport);

      let worker = new zx.server.work.Worker();
      zx.io.api.server.ConnectionManager.getInstance().registerApi(worker.getServerApi(), "/work/pools/local");
      let clientApi = new zx.io.api.client.GenericClientApiProxy(zx.server.work.IWorkerApi, clientTransport, "/work/pools/local");

      let workerTracker = new zx.server.work.pools.LocalWorkerTracker(this, clientApi, serverApi);
      await workerTracker.initialise();
      return workerTracker;
    },

    /**
     * @override
     */
    async destroyPoolableEntity(entity) {
      entity.stop();
      entity.dispose();
    }
  }
});
