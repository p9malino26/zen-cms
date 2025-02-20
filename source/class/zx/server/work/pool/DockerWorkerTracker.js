qx.Class.define("zx.server.work.pool.DockerWorkerTracker", {
  extend: zx.server.work.WorkerTracker,

  construct(workerPool, container, dockerConfig) {
    super(workerPool, null);
    this.__container = container;
    this.__dockerConfig = dockerConfig;
  },

  members: {
    __container: null,
    __dockerConfig: null,

    async initialise() {
      let resolved = false;
      let promise = new Promise(resolve => {
        container.attach({ stream: true, stdout: true, stderr: false }, (err, stream) => {
          if (err) {
            this.error(err);
            return;
          }
          stream.on("data", data => {
            if (!resolved) {
              if (data.toString().includes(zx.server.work.pool.DockerWorkerPool.READY_SIGNAL)) {
                resolve();
                resolved = true;
              }
              return;
            }
            this.appendWorkLog(data);
          });
        });
      });
      container.attach({ stream: true, stdout: false, stderr: true }, (err, stream) => {
        if (err) {
          this.error(err);
          return;
        }
        stream.on("data", data => this.appendWorkLog(data));
      });

      await container.start();
      this.debug(`spawned worker, waiting for ready signal...`);
      await promise;

      let chromiumPort = parseInt(this.__dockerConfig.HostConfig.PortBindings["3000/tcp"][0].HostPort, 10);
      let url = `http://localhost:${chromiumPort}`;
      let transport = new zx.io.api.transport.http.HttpClientTransport(url + this.__workerPool.getRoute());
      let workerClientApi = new zx.server.work.api.WorkerClientApi(transport, apiPath);
      this._setWorkerClientApi(workerClientApi);

      this.debug(`worker ready`);
      await super.initialise();
    },

    /**
     * Kills the node process
     */
    async killDockerContainer() {
      if (this.__container) {
        await new Promise(resolve => {
          this.__container.kill(() => {
            let port = parseInt(this.__dockerConfig.HostConfig.PortBindings["9229/tcp"][0].HostPort, 10);
            if (!isNaN(port)) {
              zx.server.PortRanges.getNodeDebugPortRange().release(port);
            }
            port = parseInt(this.__dockerConfig.HostConfig.PortBindings["3000/tcp"][0].HostPort, 10);
            if (!isNaN(port)) {
              zx.server.PortRanges.getChromiumPortRange().release(port);
            }
            resolve();
          });
          this.__container = null;
        });
      }
    }
  }
});
