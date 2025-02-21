qx.Class.define("zx.server.work.pools.LocalWorkerTracker", {
  extend: zx.server.work.WorkerTracker,

  construct(workerPool, worker, workerClientApi, workerServerApi) {
    super(workerPool, workerClientApi);
    this.__worker = worker;
    this.__workerServerApi = workerServerApi;
  },

  members: {
    /** @type{zx.server.work.IWorker} */
    __worker: null,

    /** @type{zx.server.work.IWorkerApi} */
    __workerServerApi: null,

    /**
     * Kills the node process
     */
    async stop() {
      if (this.__workerServerApi) {
        this.__worker.dispose();
        this.__worker = null;
        this.__workerServerApi.dispose();
        this.__workerServerApi = null;
        this.getWorkerClientApi().terminate();
        this.getWorkerClientApi().dispose();
      }
    }
  }
});
