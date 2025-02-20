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
   * @param {zx.server.work.pool.AbstractWorkerPool} workerPool
   * @param {zx.server.work.api.WorkerClientApi?} workerClientApi
   */
  construct(workerPool, workerClientApi) {
    super();
    this.__workerPool = workerPool;
    this.__workerClientApi = workerClientApi;
  },

  properties: {
    status: {
      init: "waiting",
      check: ["waiting", "running", "stopped", "killing", "dead"],
      event: "changeStatus"
    }
  },

  statics: {
    __DF_LOG: new qx.util.format.DateFormat("yyyy-MM-dd HH:mm:ss")
  },

  members: {
    /** @type{zx.server.work.pool.AbstractWorkerPool} the pool this belong to */
    __workerPool: null,

    /** @type{zx.server.work.api.WorkerClientApi} connection to the actual worker */
    __workerClientApi: null,

    /** @type{*?} the currently running work */
    __jsonWork: null,

    /** @type{String} the path for storing anythign to do with the Work being run by the Worker (eg log files) */
    __workdir: null,

    /** @type{WriteStream} where to write logs for the Work */
    __logStream: null,

    /** @type{*} JSON status that is written into the workdir */
    __workStatus: null,

    async initialize() {
      await this.__workerClientApi.subscribe("log", data => {
        if (this.__jsonWork?.uuid === data.caller) {
          this.appendWorkLog(data.message);
        } else {
          this.log(data.message);
        }
      });
    },

    _setWorkerClientApi(workerClientApi) {
      if (this.__workerClientApi) {
        throw new Error("Cannot set workerClientApi more than once");
      }
      this.__workerClientApi = workerClientApi;
    },

    /**
     * Called to start a new piece of work on the worker
     *
     * @param {*} jsonWork
     */
    async runWork(jsonWork) {
      if (this.__jsonWork) {
        throw new Error("WorkerTracker already has work");
      }
      this.__workdir = path.join(this.__workerPool.getWorkDir(), "work", jsonWork.uuid);
      await fs.mkdir(this.__workdir, { recursive: true });
      this.__logStream = fs.createWriteStream(path.join(this.__workdir, "log.txt"));
      this.__workStatus = {
        started: new Date(),
        logFile: "log.txt"
      };
      this.appendWorkLog("Starting work: " + JSON.stringify(jsonWork, null, 2));
      this.setStatus("running");
      this._writeWorkStatus();
      let promise = this.__workerClientApi.run(jsonWork);
      promise.then(response => this._onWorkComplete(response));
    },

    /**
     * Appends a message to the log for the Work
     *
     * @param {String} message
     */
    appendWorkLog(message) {
      this.__logStream.write(zx.server.work.WorkerTracker.__DF_LOG.format(new Date()) + " " + message + "\n");
    },

    /**
     * Persists the __workStatus to disk
     */
    async _writeWorkStatus() {
      await fs.writeFile(path.join(this.__workdir, "status.json"), JSON.stringify(this.__workStatus, null, 2));
    },

    /**
     * Called when the work is complete
     *
     * @param {*} response the value returned by the WorkerClientApi.run method
     */
    _onWorkComplete(response) {
      this.__workStatus.response = response;
      this.__workStatus.completed = new Date();
      this.appendWorkLog("Work complete: " + JSON.stringify(response.result));
      this._writeWorkStatus();
      if (this.getStatus() === "killing" || response.result == "killed") {
        this.setStatus("dead");
      } else {
        this.setStatus("stopped");
      }
      fs.close(this.__logStream);
      this.__logStream = null;
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

    /**
     * The work directory
     *
     * @returns {String} the path to the work directory
     */
    getWorkDir() {
      return this.__workdir;
    },

    /**
     * Deletes the work directory
     */
    async deleteWorkDir() {
      if (this.__workdir) {
        await fs.rm(this.__workdir, { recursive: true, force: true });
        this.__workdir = null;
      }
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
      if (this.__workdir) {
        this.error(`Reusing a WorkerTracker that still has a workdir - ${this.__workdir}`);
        this.__workdir = null;
      }
      this.setStatus("waiting");
    }
  }
});
