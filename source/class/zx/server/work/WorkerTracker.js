const Docker = require("dockerode");
const fs = require("fs");
const path = require("path");

/**
 * Tracks a worker; the worker is often in a remote process, and will feed back logs and status
 * via the WorkerClientApi.  Instances of this class are used to track everything about that
 * Worker, including storing the logs and status ready to be passed back to the Scheduler
 * when the Worker is complete.
 */
qx.Class.define("zx.server.work.WorkerTracker", {
  extend: qx.core.Object,

  /**
   *
   * @param {zx.server.work.pools.WorkerPool} workerPool
   * @param {zx.server.work.IWorkerApi?} workerClientApi
   */
  construct(workerPool, workerClientApi) {
    super();
    this.__workerPool = workerPool;
    this.__workerClientApi = workerClientApi;
  },

  destruct() {
    this.__workerClientApi.terminate();
    this.__workerClientApi.dispose();
    this.__workerClientApi = null;
    if (this.__containerConsoleLog) {
      this.__containerConsoleLog.dispose();
      this.__containerConsoleLog = null;
    }
  },

  properties: {
    status: {
      init: "waiting",
      check: ["waiting", "running", "stopped", "killing", "dead"],
      event: "changeStatus"
    }
  },

  members: {
    /** @type{zx.server.work.pools.WorkerPool} the pool this belong to */
    __workerPool: null,

    /** @type{zx.server.work.IWorkerApi} connection to the actual worker */
    __workerClientApi: null,

    /** @type{*?} the currently running work */
    __jsonWork: null,

    /** @type{zx.server.work.WorkResult} the output of the currently running (or just stopped) work */
    __workResult: null,

    /** @type{zx.utils.IncrementalLogWriter} where to log the container console output */
    __containerConsoleLog: null,

    /** @type{zx.utils.Timeout} timer used to watch the container to see if it disappears */
    __containerWatcher: null,

    /** @type{Integer} the port that the node process will be listening to; this can be for API calls or it's the puppeteer server in docker */
    _nodeHttpPort: null,

    /**
     * Called when starting the WorkTracker
     */
    async initialize() {
      await this.__workerClientApi.subscribe("log", data => {
        if (this.__jsonWork?.uuid === data.caller) {
          this.appendWorkLog(data.message);
        } else {
          this.error(data.message);
        }
      });
    },

    /**
     * Closes the WorkerTracker and frees resources
     */
    async close() {
      this.debug(`Closing worker`);
      let clientApi = this.getWorkerClientApi();
      try {
        await clientApi.shutdown();
      } catch (ex) {
        // Shutdown will reject the method call, so this is actually expected
        this.trace(`Expected exception while shutting down worker: ${ex}`);
      }
      await this._closeContainer();
      await clientApi.terminate();
    },

    /**
     * Sets the WorkerClientApi for this WorkerTracker; this is only used if it could not be set in the constructor
     */
    _setWorkerClientApi(workerClientApi) {
      if (this.__workerClientApi) {
        throw new Error("Cannot set workerClientApi more than once");
      }
      this.__workerClientApi = workerClientApi;
    },

    /**
     * Returns the WorkerClientApi for this WorkerTracker
     *
     * @returns {zx.server.work.IWorkerApi}
     */
    getWorkerClientApi() {
      return this.__workerClientApi;
    },

    /**
     * Returns the WorkerPool for this WorkerTracker
     *
     * @returns {zx.server.work.pools.WorkerPool}
     */
    getWorkerPool() {
      return this.__workerPool;
    },

    /**
     * Called to start a new piece of work on the worker
     *
     * @param {*} jsonWork
     */
    async runWork(jsonWork) {
      if (this.__workResult) {
        throw new Error("WorkerTracker already has work");
      }
      this.__jsonWork = jsonWork;
      let workdir = path.join(this.__workerPool.getWorkDir(), "work", jsonWork.uuid);
      this.__workResult = new zx.server.work.WorkResult();
      await this.__workResult.initialize(workdir, jsonWork);
      this.setStatus("running");
      this.__workResult.writeStatus();
      let promise = this.__workerClientApi.run(jsonWork);
      promise.then(async response => await this._onWorkComplete(response));
    },

    /**
     * Appends a message to the log for the Work
     *
     * @param {String} message
     */
    appendWorkLog(message) {
      if (this.__workResult) {
        this.__workResult.appendWorkLog(message);
      }
    },

    /**
     * Called when the work is complete
     */
    async _onWorkComplete(response) {
      this.appendWorkLog("Work complete for " + this.__jsonWork.uuid + ", response = " + JSON.stringify(response));
      let workResult = this.__workResult;
      workResult.response = response;
      await workResult.close();
      if (this.getStatus() === "killing" || !!response.exception) {
        this.setStatus("dead");
      } else {
        this.setStatus("stopped");
      }
      this.__workStatus = null;
      this.__jsonWork = null;
    },

    /**
     * Kills the work and the worker
     */
    killWork() {
      if (this.getStatus() != "dead") {
        this.setStatus("killing");
        this.__workerClientApi.terminate();
      }
    },

    getWorkResult() {
      return this.__workResult;
    },

    /**
     * Called by the WorkerPool when a Work is finished, so that the results can be shipped back to the Scheduler
     */
    takeWorkResult() {
      let workResult = this.__workResult;
      this.__workResult = null;
      return workResult;
    },

    /**
     * Called to reuse the worker, before it goes back into the pool
     */
    async reuse() {
      if (this.getStatus() == "killing" || this.getStatus() == "dead") {
        throw new Error("Cannot reuse a WorkerTracker that is killing or dead");
      }
      if (this.getStatus() != "stopped") {
        throw new Error("Cannot reuse a WorkerTracker that is not stopped");
      }
      if (this.__workResult) {
        this.error(`Reusing a WorkerTracker that still has a workResult - ${this.__workResult}`);
        this.__workResult = null;
      }
      this.setStatus("waiting");
    },

    /**
     * Gets, allocating if necessary, the port for the chromium server
     *
     * @returns {Integer} the port for the chromium server (exposed by the docker container)
     */
    _getChromiumPort() {
      if (!this.__chromiumPort) {
        this.__chromiumPort = zx.server.PortRanges.getChromiumPortRange().acquire();
      }
      return this.__chromiumPort;
    },

    /**
     * Gets, allocating if necessary, the port for the node http server
     *
     * @returns {Integer} the port for the node http server
     */
    _getNodeHttpPort() {
      if (!this._nodeHttpPort) {
        this._nodeHttpPort = zx.server.PortRanges.getNodeHttpServerApiPortRange().acquire();
      }
      return this._nodeHttpPort;
    },

    /**
     * Creates a Docker container for the worker; if configCb is provided, it will be called with
     * the Docker config so that it can be adjusted to suit
     *
     * @param {Function?} configCb
     * @returns {import('dockerode').Container}
     */
    async _createDockerContainer(configCb, readySignal) {
      if (!readySignal) {
        readySignal = "Webserver started on http";
      }
      let workerPool = this.getWorkerPool();

      let ExposedPorts = {};
      let PortBindings = {};
      let Env = [];

      ExposedPorts["11000/tcp"] = {};
      PortBindings["11000/tcp"] = [{ HostPort: String(this._getChromiumPort()) }];

      // prettier-ignore
      Env = [
        `ZX_NODE_ARGS=./runtime/puppeteer-server/index.js launch --port=10000 --chromium-port=11000`, 
        "ZX_MODE=worker"
      ];

      /** @type {import('dockerode').ContainerCreateOptions} */
      let dockerConfig = {
        Image: workerPool.getDockerImage(),
        name: `zx-worker-${this._getNodeHttpPort()}`,
        AttachStderr: true,
        AttachStdout: true,
        Env,
        Labels: {
          "zx.services.type": workerPool.getDockerServicesTypeLabel()
        },
        ExposedPorts,
        Tty: true,
        HostConfig: {
          AutoRemove: true,
          Binds: [],
          PortBindings
        }
      };
      if (workerPool.getDockerCommand()) {
        dockerConfig.Cmd = workerPool.getDockerCommand().split(" ");
      }

      if (workerPool.getDockerMounts()) {
        for (let mount of workerPool.getDockerMounts()) {
          let segs = mount.split(":");
          if (segs.length != 2 || !path.isAbsolute(segs[1])) {
            throw new Error(`Invalid docker mount: ${mount}`);
          }
          segs[0] = path.resolve(process.cwd(), segs[0]);
          mount = segs.join(":");
          dockerConfig.HostConfig.Binds.push(mount);
        }
      }
      let appMountVolume = path.resolve(process.cwd(), workerPool.getAppMountVolume());
      dockerConfig.HostConfig.Binds.push(`${appMountVolume}:/home/pptruser/app/runtime/`);

      if (configCb) {
        configCb(dockerConfig);
      }

      let containerDir = path.join(workerPool.getWorkDir(), "container", "" + this._getNodeHttpPort());
      await fs.promises.mkdir(containerDir, { recursive: true });
      this.__containerConsoleLog = new zx.utils.IncrementalLogWriter(path.join(containerDir, "console.log"));

      const onContainerMessage = message => {
        this.__containerConsoleLog.write(message + "\n");
        this.appendWorkLog(message);
      };

      // prettier-ignore
      onContainerMessage("Starting container\n" +
          "  pwd: " + process.cwd() + "\n" +
          "  image: " + dockerConfig.Image + "\n" +
          "  chromiumPort: " + this.__chromiumPort + "\n" +
          "  nodeHttpPort: " + this._getNodeHttpPort() + "\n" +
          "  nodeDebugPort: " + this.__nodeDebugPort + "\n" +
          "  Docker Container Config: " + JSON.stringify(dockerConfig, null, 2));

      let docker = new Docker();
      let container = await docker.createContainer(dockerConfig);
      this.__container = container;

      let promise = new qx.Promise();
      let streams = new zx.utils.BufferedIoStreams(line => {
        if (line.toString().indexOf(readySignal) > -1) {
          promise.resolve();
        } else {
          onContainerMessage(line);
        }
      });
      this.__container.attach({ stream: true, stdout: true, stderr: false }, (err, stream) => {
        if (err) {
          this.error("Error attached to stdout stream from Docker: " + err);
        } else {
          streams.add(stream);
        }
      });
      this.__container.attach({ stream: true, stdout: false, stderr: true }, (err, stream) => {
        if (err) {
          this.error("Error attached to stderr stream from Docker: " + err);
        } else {
          streams.add(stream);
        }
      });
      await container.start();
      let shutdownDetected = false;
      this.__containerWatcher = new zx.utils.Timeout(2000, async () => {
        let state;
        try {
          state = await container.inspect();
        } catch (ex) {
          this.error("Error inspecting container: " + ex);
        }
        if (!state?.State?.Running && !shutdownDetected) {
          shutdownDetected = false;
          this.__containerWatcher.setEnabled(false);
          this.fireEvent("containerShutdown");
          if (promise != null) {
            let log = await this.__containerConsoleLog.read();
            this.debug("Container did not start: \n" + log);
            promise.reject(new Error("Container did not start"));
            promise = null;
          }
        }
      }).set({
        recurring: true
      });
      this.__containerWatcher.startTimer();
      this.debug(`started container, waiting for ready signal...`);
      await promise;
      promise = null;
      this.debug("container ready");
      return container;
    },

    /**
     * Closes the container and releases the chromium port
     */
    async _closeContainer() {
      if (this.__container) {
        this.__containerWatcher.dispose();
        let timeout = this.getWorkerPool().getShutdownTimeout();
        let timedWaitFor = new zx.utils.TimedWaitFor(timeout);
        this.__container.stop(() => {
          this.debug(`Container stopped`);
          timedWaitFor.fire();
        });
        await timedWaitFor.wait();
        this.__container = null;
      }
      if (this.__chromiumPort) {
        zx.server.PortRanges.getChromiumPortRange().release(this.__chromiumPort);
        this.__chromiumPort = null;
      }
    },

    /**
     * @Override
     */
    toString() {
      return `NodeProcessWorkerTracker:${this._nodeHttpPort}[this.toHashCode()]`;
    }
  }
});
