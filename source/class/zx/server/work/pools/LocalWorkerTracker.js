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
    async initialize() {
      await super.initialize();
      if (this.getWorkerPool().isEnableChromium()) {
        await this._createDockerContainer();
        let chromiumUrl = `http://localhost:${this._getNodeHttpPort()}`;
        this.__worker.setChromiumUrl(chromiumUrl);
      }
    },

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
    async close() {
      await super.close();
      if (this.__worker) {
        this.__worker.dispose();
        this.__worker = null;
      }
    }
  }
});
