qx.Class.define("zx.server.work.pools.nodeThreadWorkerTracker", {
  extend: zx.server.work.WorkerTracker,

  construct(workerPool, nodeThread) {
    super(workerPool, null);
    this.__nodeThread = nodeThread;
  },

  members: {
    /** @type{import("node:worker_threads").Worker} */
    __nodeThread: null,

    async initialise() {
      this.__nodeThread.on("error", err => {
        if (this.getState() == "running") {
          this.appendWorkLog(err);
        } else {
          this.debug(err);
        }
      });
      this.__nodeThread.on("exit", code => {
        if (this.getState() == "running") {
          this.appendWorkLog(`Worker stopped with exit code ${code}`);
        }
        this.error(`Worker stopped with exit code ${code}`);
        this.setState("dead");
      });
      let clientApi = new zx.io.api.transport.nodeworker.NodeWorkerClientTransport();
      this._setWorkerClientApi(clientApi);
      await super.initialise();
    }
  }
});
