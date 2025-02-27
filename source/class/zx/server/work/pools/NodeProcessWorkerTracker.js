const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

qx.Class.define("zx.server.work.pools.NodeProcessWorkerTracker", {
  extend: zx.server.work.WorkerTracker,

  construct(workerPool) {
    super(workerPool, null);
  },

  destruct() {
    this.__apiClientTransport.dispose();
    this.__apiClientTransport = null;
    if (this.__containerWatcher) {
      this.__containerWatcher.dispose();
      this.__containerWatcher = null;
    }
    if (this.__processConsoleLog) {
      this.__processConsoleLog.dispose();
      this.__processConsoleLog = null;
    }
  },

  events: {
    containerShutdown: "qx.event.type.Event"
  },

  members: {
    /** @type{child_process} the child process */
    __nodeProcess: null,

    /** @type{Integer} the port that the node process will be listening to for debugging */
    __nodeDebugPort: null,

    /** @type{zx.io.api.transport.AbstractClientTransport} the transport used for API calls */
    __apiClientTransport: null,

    /** @type{zx.utils.IncrementalLogWriter} where to log the process console output */
    __processConsoleLog: null,

    /**
     * Called when starting the WorkerTracker.
     */
    async initialize() {
      let workerPool = this.getWorkerPool();

      if (workerPool.getNodeLocation() == "container" || workerPool.isEnableChromium()) {
        await this._createContainer(dockerConfig => {
          if (workerPool.getNodeLocation() == "container") {
            dockerConfig.ExposedPorts["10000/tcp"] = {};
            dockerConfig.PortBindings["10000/tcp"] = [{ HostPort: String(this._getNodeHttpPort()) }];

            let inspect = workerPool.getNodeInspect();
            if (inspect != "none") {
              dockerConfig.ExposedPorts["9229/tcp"] = {};
              dockerConfig.PortBindings["9229/tcp"] = [{ HostPort: String(this._getNodeDebugPort()) }];
              dockerConfig.Env.push(`ZX_NODE_INSPECT=--${inspect}=0.0.0.0`);
            }

            let chromiumUrl = null;
            if (workerPool.isEnableChromium()) {
              chromiumUrl = `http://localhost:11000`;
            }

            let nodeCmd = workerPool.getFullNodeProcessCommandLine(10000, chromiumUrl, inspect, inspect != "none" ? 9229 : null);
            // prettier-ignore
            dockerConfig.Env = [
              `ZX_NODE_ARGS=${nodeCmd.join(" ")}`, 
              "ZX_MODE=worker"
            ];
          }
        }, "zx.server.work.WORKER_READY_SIGNAL");
      }

      if (workerPool.getNodeLocation() == "host") {
        let inspect = workerPool.getNodeInspect();
        let chromiumUrl = null;
        if (workerPool.isEnableChromium()) {
          chromiumUrl = `http://localhost:${this._getNodeHttpPort()}`;
        }
        let nodeCmd = workerPool.getFullNodeProcessCommandLine(this._getNodeHttpPort(), chromiumUrl, inspect, inspect != "none" ? this._getNodeDebugPort() : null);
        if (!path.isAbsolute(nodeCmd[0])) {
          let appMountVolume = workerPool.getAppMountVolume();
          if (!path.isAbsolute(appMountVolume)) {
            appMountVolume = path.join(process.cwd(), appMountVolume);
          }
          nodeCmd[0] = path.join(appMountVolume, nodeCmd[0]);
        }

        this.debug("Running command: " + nodeCmd.join(" "));
        this.__nodeProcess = child_process.spawn("node", nodeCmd, {});

        let processDir = path.join(workerPool.getWorkDir(), "process", "" + this.__nodeProcess.pid);
        await fs.promises.mkdir(processDir, { recursive: true });
        this.__processConsoleLog = new zx.utils.IncrementalLogWriter(path.join(processDir, "console.log"));

        const onConsoleMessage = message => {
          this.__processConsoleLog.write(message + "\n");
          this.appendWorkLog(message);
        };

        // prettier-ignore
        onConsoleMessage("Starting node process: " + this.__nodeProcess.spawnfile + " " + this.__nodeProcess.spawnargs.join(" ") + "\n" +
          "  pid: " + this.__nodeProcess.pid + "\n" +
          "  pwd: " + process.cwd() + "\n" +
          "  nodeHttpPort: " + this._getNodeHttpPort() + "\n" +
          "  nodeDebugPort: " + this.__nodeDebugPort + "\n");

        let promise = new qx.Promise();
        let streams = new zx.utils.BufferedIoStreams(line => {
          if (line.toString().indexOf("zx.server.work.WORKER_READY_SIGNAL") > -1) {
            promise.resolve();
          } else {
            onConsoleMessage(line);
          }
        });
        streams.add(this.__nodeProcess.stdout, this.__nodeProcess.stderr);

        this.__nodeProcess.on("close", code => {
          let wasRunning = this.getStatus() == "running";
          this.setStatus("dead");
          if (wasRunning) {
            onConsoleMessage("Process died unexpectedly");
          }
          streams.close();
        });
        this.debug(`spawned worker process, waiting for ready signal...`);
        await promise;
        this.debug("worker process ready");
      }

      let url = `http://localhost:${this._getNodeHttpPort()}/zx-api/`;
      this.__apiClientTransport = new zx.io.api.transport.http.HttpClientTransport(url);
      let workerClientApi = zx.io.api.ApiUtils.createClientApi(zx.server.work.IWorkerApi, this.__apiClientTransport, "/work/worker");
      this._setWorkerClientApi(workerClientApi);

      this.debug(`worker ready`);
      await super.initialize();
    },

    async close() {
      this.debug(`Closing worker`);
      let clientApi = this.getWorkerClientApi();
      let timedWaitFor = null;
      let nodeProcessClosed = false;
      let timeout = this.getWorkerPool().getShutdownTimeout();
      if (this.__nodeProcess) {
        let pid = this.__nodeProcess.pid;
        timedWaitFor = new zx.utils.TimedWaitFor(timeout);
        this.__nodeProcess.once("close", () => {
          this.debug(`Node process ${pid} terminated`);
          nodeProcessClosed = true;
          timedWaitFor.fire();
        });
      }
      try {
        await clientApi.shutdown();
      } catch (ex) {
        // Shutdown will reject the method call, so this is actually expected
        this.trace(`Expected exception while shutting down worker: ${ex}`);
      }
      if (timedWaitFor) {
        await timedWaitFor.wait();
      }
      if (this.__nodeProcess) {
        let pid = this.__nodeProcess.pid;
        if (!nodeProcessClosed) {
          this.debug(`Killing node process ${pid}`);
          this.__nodeProcess.kill();
        }
        this.__nodeProcess = null;
      }
      this._closeContainer();
      await clientApi.terminate();
      zx.server.PortRanges.getNodeHttpServerApiPortRange().release(this._nodeHttpPort);
      this._nodeHttpPort = null;
      if (this.__nodeDebugPort) {
        zx.server.PortRanges.getNodeDebugPortRange().release(this.__nodeDebugPort);
        this.__nodeDebugPort = null;
      }
    },

    _getNodeDebugPort() {
      if (!this.__nodeDebugPort) {
        this.__nodeDebugPort = zx.server.PortRanges.getNodeDebugPortRange().acquire();
      }
      return this.__nodeDebugPort;
    }
  }
});
