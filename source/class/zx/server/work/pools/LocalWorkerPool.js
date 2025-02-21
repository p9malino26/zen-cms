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
  extend: zx.server.work.WorkerPool,

  members: {
    /**
     * @override
     */
    async createPoolableEntity() {
      let serverTransport = new zx.io.api.transport.loopback.LoopbackServerTransport();
      let clientTransport = new zx.io.api.transport.loopback.LoopbackClientTransport();

      serverTransport.connect(clientTransport);
      clientTransport.connect(serverTransport);

      let serverApi = new zx.server.work.api.WorkerServerApi(this.getRoute());
      let clientApi = new zx.server.work.api.WorkerClientApi(clientTransport, this.getRoute());

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
