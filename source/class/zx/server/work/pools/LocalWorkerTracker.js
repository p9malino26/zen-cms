qx.Class.define("zx.server.work.pools.LocalWorkerTracker", {
  extend: zx.server.work.WorkerTracker,

  construct(workerPool, workerClientApi, workerServerApi) {
    super(workerPool, workerClientApi;
    this.__workerServerApi = workerServerApi;
  },

  members: {
    __workerServerApi: null,

    /**
     * Kills the node process
     */
    async stop() {
      if (this.__workerServerApi) {
        this.__workerServerApi.dispose();
        this.__workerServerApi = null;
        this.getWorkerClientApi().terminate();
        this.getWorkerClientApi().dispose();
      }
    }
  }
});
