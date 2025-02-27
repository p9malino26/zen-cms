const Docker = require("dockerode");
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
    if (this.__containerConsoleLog) {
      this.__containerConsoleLog.dispose();
      this.__containerConsoleLog = null;
    }
  },

  events: {
    containerShutdown: "qx.event.type.Event"
  },

  members: {
    /** @type{child_process} the child process */
    __nodeProcess: null,

    /** @type{Integer} the port that the node process will be listening to for API calls */
    __nodeHttpPort: null,

    /** @type{Integer} the port that the node process will be listening to for debugging */
    __nodeDebugPort: null,

    /** @type{zx.io.api.transport.AbstractClientTransport} the transport used for API calls */
    __apiClientTransport: null,

    /** @type{zx.utils.IncrementalLogWriter} where to log the process console output */
    __processConsoleLog: null,

    /** @type{zx.utils.IncrementalLogWriter} where to log the container console output */
    __containerConsoleLog: null,

    /** @type{zx.utils.Timeout} timer used to watch the container to see if it disappears */
    __containerWatcher: null,

    /**
     * @Override
     */
    toString() {
      return `NodeProcessWorkerTracker:${this.__nodeHttpPort}[this.toHashCode()]`;
    },

    /**
     * Called when starting the WorkerTracker.
     */
    async initialize() {
      let workerPool = this.getWorkerPool();
      this.__nodeHttpPort = zx.server.PortRanges.getNodeHttpServerApiPortRange().acquire();

      const getNodeDebugPort = () => {
        if (!this.__nodeDebugPort) {
          this.__nodeDebugPort = zx.server.PortRanges.getNodeDebugPortRange().acquire();
        }
        return this.__nodeDebugPort;
      };
      const getChromiumPort = () => {
        if (!this.__chromiumPort) {
          this.__chromiumPort = zx.server.PortRanges.getChromiumPortRange().acquire();
        }
        return this.__chromiumPort;
      };

      if (workerPool.getNodeLocation() == "container" || workerPool.isEnableChromium()) {
        let ExposedPorts = {};
        let PortBindings = {};
        let Env = [];

        if (workerPool.isEnableChromium()) {
          ExposedPorts["11000/tcp"] = {};
          PortBindings["11000/tcp"] = [{ HostPort: String(getChromiumPort()) }];
        }

        if (workerPool.getNodeLocation() == "container") {
          ExposedPorts["10000/tcp"] = {};
          PortBindings["10000/tcp"] = [{ HostPort: String(this.__nodeHttpPort) }];

          let inspect = workerPool.getNodeInspect();
          if (inspect != "none") {
            ExposedPorts["9229/tcp"] = {};
            PortBindings["9229/tcp"] = [{ HostPort: String(getNodeDebugPort()) }];
            Env.push(`ZX_NODE_INSPECT=--${inspect}=0.0.0.0`);
          }
          let nodeCmd = workerPool.getFullNodeProcessCommandLine(10000, inspect, inspect != "none" ? 9229 : null);
          Env = [`ZX_NODE_ARGS=${nodeCmd.join(" ")}`, "ZX_MODE=worker"];
        }

        /** @type {import('dockerode').ContainerCreateOptions} */
        let dockerConfig = {
          Image: workerPool.getDockerImage(),
          name: `zx-worker-${this.__nodeHttpPort}`,
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

        let containerDir = path.join(workerPool.getWorkDir(), "container", "" + this.__nodeHttpPort);
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
          "  nodeHttpPort: " + this.__nodeHttpPort + "\n" +
          "  nodeDebugPort: " + this.__nodeDebugPort + "\n");

        this.debug("Docker Container Config: " + JSON.stringify(dockerConfig, null, 2));
        let docker = new Docker();
        let container = await docker.createContainer(dockerConfig);
        this.__container = container;

        let promise = new qx.Promise();
        let streams = new zx.utils.BufferedIoStreams(line => {
          if (line.toString().indexOf("zx.server.work.WORKER_READY_SIGNAL") > -1) {
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
      }

      if (workerPool.getNodeLocation() == "host") {
        let inspect = workerPool.getNodeInspect();
        let nodeCmd = workerPool.getFullNodeProcessCommandLine(this.__nodeHttpPort, inspect, inspect != "none" ? getNodeDebugPort() : null);
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
          "  nodeHttpPort: " + this.__nodeHttpPort + "\n" +
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

      let url = `http://localhost:${this.__nodeHttpPort}/zx-api/`;
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
      if (this.__container) {
        timedWaitFor = new zx.utils.TimedWaitFor(timeout);
        this.__container.stop(() => {
          this.debug(`Container stopped`);
          timedWaitFor.fire();
        });
        await timedWaitFor.wait();
      }
      await clientApi.terminate();
      zx.server.PortRanges.getNodeHttpServerApiPortRange().release(this.__nodeHttpPort);
      if (this.__nodeDebugPort) {
        zx.server.PortRanges.getNodeDebugPortRange().release(this.__nodeDebugPort);
      }
      if (this.__chromiumPort) {
        zx.server.PortRanges.getChromiumPortRange().release(this.__chromiumPort);
      }
    }
  }
});
