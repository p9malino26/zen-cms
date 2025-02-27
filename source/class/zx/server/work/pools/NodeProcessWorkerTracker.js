const readline = require("readline");
const fs = require("fs");
const path = require("path");

qx.Class.define("zx.server.work.pools.NodeProcessWorkerTracker", {
  extend: zx.server.work.WorkerTracker,

  construct(workerPool, nodeProcess, httpPort, nodeDebugPort) {
    super(workerPool, null);
    this.__nodeProcess = nodeProcess;
    this.__httpPort = httpPort;
    this.__nodeDebugPort = nodeDebugPort;
  },

  destruct() {
    this.__apiClientTransport.dispose();
    this.__apiClientTransport = null;
  },

  members: {
    /** @type{Integer} the PID of the node process */
    __pid: 0,

    /** @type{child_process} the child process */
    __nodeProcess: null,

    /** @type{Integer} the port that the node process will be listening to for API calls */
    __httpPort: null,

    /** @type{Integer} the port that the node process will be listening to for debugging */
    __nodeDebugPort: null,

    /** @type{String} where to log the process console output */
    __processConsoleLogPath: null,

    /** @type{zx.io.api.transport.AbstractClientTransport} the transport used for API calls */
    __apiClientTransport: null,

    /** @type{zx.utils.Debounced} debouncer used for writing the console log */
    __debouncedWriteLog: null,

    /** @type{String} console output, waitying to be written to disk */
    __unwrittenConsoleLog: null,

    /**
     * Called when starting the WorkerTracker.
     */
    async initialize() {
      let nodeProcess = this.__nodeProcess;
      this.__pid = nodeProcess.pid;

      let processDir = path.join(this.getWorkerPool().getWorkDir(), "process", "" + this.__pid);
      await fs.promises.mkdir(processDir, { recursive: true });
      this.__processConsoleLogPath = path.join(processDir, "console.log");

      this.__debouncedWriteLog = new zx.utils.Debounce(() => this.__writeConsoleLog(), 500);

      // prettier-ignore
      this.__onConsoleMessage("Starting node process: " + nodeProcess.spawnfile + " " + nodeProcess.spawnargs.join(" ") + "\n" +
        "  pid: " + this.__pid + "\n" +
        "  pwd: " + process.cwd() + "\n" +
        "  httpPort: " + this.__httpPort + "\n" +
        "  nodeDebugPort: " + this.__nodeDebugPort + "\n");

      let resolve;
      let promise = new Promise(res => (resolve = res));
      let rlStdout = readline.createInterface({
        input: nodeProcess.stdout,
        crlfDelay: Infinity
      });
      let rlStderr = readline.createInterface({
        input: nodeProcess.stderr,
        crlfDelay: Infinity
      });

      rlStdout.on("line", line => {
        if (line.toString().indexOf("zx.server.work.WORKER_READY_SIGNAL") > -1) {
          resolve?.();
          resolve = null;
          return;
        }
        this.__onConsoleMessage(line);
      });
      rlStderr.on("line", line => this.__onConsoleMessage(line));

      nodeProcess.on("close", code => {
        let wasRunning = this.getStatus() == "running";
        this.setStatus("dead");
        if (wasRunning) {
          this.__onConsoleMessage("Process died unexpectedly");
        }
        rlStdout.close();
        rlStderr.close();
      });
      this.debug(`spawned worker, waiting for ready signal...`);
      await promise;

      let url = `http://localhost:${this.__httpPort}/zx-api/`;
      this.__apiClientTransport = new zx.io.api.transport.http.HttpClientTransport(url);
      let workerClientApi = zx.io.api.ApiUtils.createClientApi(zx.server.work.IWorkerApi, this.__apiClientTransport, "/work/worker");
      this._setWorkerClientApi(workerClientApi);

      this.debug(`worker ready`);
      await super.initialize();
    },

    /**
     * Called for each line of output from the node process
     *
     * @param {String} message
     */
    __onConsoleMessage(message) {
      if (this.__unwrittenConsoleLog === null) {
        this.__unwrittenConsoleLog = "";
      }
      this.__unwrittenConsoleLog += message + "\n";
      this.__debouncedWriteLog.run();
      this.appendWorkLog(message);
    },

    /**
     * Debounced method to write the console log to disk
     */
    async __writeConsoleLog() {
      let log = this.__unwrittenConsoleLog;
      if (log !== null) {
        this.__unwrittenConsoleLog = null;
        try {
          await fs.promises.writeFile(this.__processConsoleLogPath, log, { flag: "a" });
        } catch (ex) {
          this.debug(`Error writing console log: ${ex}`);
        }
      }
    },

    /**
     * Kills the node process
     */
    async killNodeProcess() {
      this.debug(`Killing node process ${this.__pid}`);
      if (this.__nodeProcess) {
        let clientApi = this.getWorkerClientApi();
        await new Promise(async resolve => {
          let timedWaitFor = new zx.utils.TimedWaitFor(5000);
          this.__nodeProcess.once("close", () => {
            this.debug(`Node process ${this.__pid} terminated`);
            timedWaitFor.fire();
          });
          try {
            await clientApi.shutdown();
          } catch (ex) {
            // Shutdown will reject the method call, so this is actually expected
            this.trace(`Expected exception while shutting down worker: ${ex}`);
          }
          await timedWaitFor.wait();
          await clientApi.terminate();
          this.__nodeProcess.kill();
          this.__nodeProcess = null;
          if (this.__nodeDebugPort) {
            zx.server.PortRanges.getNodeDebugPortRange().release(this.__nodeDebugPort);
          }
          zx.server.PortRanges.getNodeHttpServerApiPortRange().release(this.__httpPort);
        });
      }
    }
  }
});
