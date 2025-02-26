qx.Class.define("zx.server.work.pools.NodeProcessWorkerTracker", {
  extend: zx.server.work.WorkerTracker,

  construct(workerPool, nodeProcess, httpPort, nodeDebugPort) {
    super(workerPool, null);
    this.__nodeProcess = nodeProcess;
    this.__httpPort = httpPort;
    this.__nodeDebugPort = nodeDebugPort;
  },

  members: {
    __nodeProcess: null,
    __httpPort: null,
    __nodeDebugPort: null,

    async initialize() {
      let nodeProcess = child_process.spawn("node", params, {});

      let resolve;
      let promise = new Promise(res => (resolve = res));
      nodeProcess.stdout.on("data", data => {
        if (data.toString().indexOf("zx.server.work.WORKER_READY_SIGNAL") > -1) {
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
      let transport = new zx.io.api.transport.http.HttpClientTransport(url);
      let workerClientApi = zx.io.api.ApiUtils.createClientApi(zx.server.work.IWorkerApi, transport, "/work/worker");
      this._setWorkerClientApi(workerClientApi);

      this.debug(`worker ready`);
      await super.initialize();
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
          if (this.__nodeDebugPort) {
            zx.server.PortRanges.getNodeDebugPortRange().release(this.__nodeDebugPort);
          }
          zx.server.PortRanges.getNodeHttpServerApiPortRange.release(this.__httpPort);
        });
      }
    }
  }
});
