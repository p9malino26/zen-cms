qx.Class.define("zx.server.work.pools.NodeProcessWorkerTracker", {
  extend: zx.server.work.WorkerTracker,

  construct(workerPool, nodeProcess, httpPort) {
    super(workerPool, null);
    this.__nodeProcess = nodeProcess;
    this.__httpPort = httpPort;
  },

  members: {
    __nodeProcess: null,
    __httpPort: null,

    async initialise() {
      let nodeProcess = child_process.spawn("node", params, {});

      let resolve;
      let promise = new Promise(res => (resolve = res));
      nodeProcess.stdout.on("data", data => {
        if (data.toString().indexOf(zx.server.work.pools.NodeProcessWorkerPool.READY_SIGNAL) > -1) {
          resolve?.();
          resolve = null;
          return;
        }
        this.appendWorkLog(data);
      });
      nodeProcess.stderr.on("data", data => this.appendWorkLog(data));
      nodeProcess.on("close", code => {
        let wasRunning = this.getStatus() == "running";
        this.setStatus("killed");
        if (wasRunning) {
          this.appendWorkLog("Process died unexpectedly");
        }
      });
      this.debug(`spawned worker, waiting for ready signal...`);
      await promise;

      let url = `http://localhost:${this.__httpPort}`;
      let transport = new zx.io.api.transport.http.HttpClientTransport(url + this.__workerPool.getRoute());
      let workerClientApi = new zx.server.work.api.WorkerClientApi(transport, apiPath);
      this._setWorkerClientApi(workerClientApi);

      this.debug(`worker ready`);
      await super.initialise();
    },

    /**
     * Kills the node process
     */
    async killNodeProcess() {
      if (this.__nodeProcess) {
        await new Promise(resolve => {
          this.__nodeProcess.once("close", resolve);
          this.__nodeProcess.kill();
          this.__nodeProcess = null;
        });
      }
    }
  }
});
