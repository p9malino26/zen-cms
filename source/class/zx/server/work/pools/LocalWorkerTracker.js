qx.Class.define("zx.server.work.pools.LocalWorkerTracker", {
  extend: zx.server.work.WorkerTracker,

  construct(workerPool, worker, workerClientApi) {
    super(workerPool, workerClientApi);
    this.__worker = worker;
  },

  members: {
    /** @type{zx.server.work.IWorker} */
    __worker: null,

    /** @type{zx.server.work.IWorkerApi} */
    __workerServerApi: null,

    /**
     * @Override
     */
    appendWorkLog(message) {
      super.appendWorkLog(message);
      if (!this.getWorkResult()) {
        this.info(message);
      }
    },

    /**
     * Kills the node process
     */
    async stop() {
      if (this.__worker) {
        this.__worker.dispose();
        this.__worker = null;
        this.getWorkerClientApi().terminate();
        this.getWorkerClientApi().dispose();
      }
    }
  }
});
