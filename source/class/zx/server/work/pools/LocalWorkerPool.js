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
      let clientTransport = zx.io.api.ApiUtils.getClientTransport();

      let worker = new zx.server.work.Worker();
      let apiPath = "/work/pools/local/" + worker.toUuid();
      zx.io.api.server.ConnectionManager.getInstance().registerApi(worker.getServerApi(), apiPath);
      let clientApi = zx.io.api.ApiUtils.createClientApi(zx.server.work.IWorkerApi, clientTransport, apiPath);

      let workerTracker = new zx.server.work.pools.LocalWorkerTracker(this, worker, clientApi);
      await workerTracker.initialize();
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
