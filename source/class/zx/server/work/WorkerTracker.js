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
     * Sets the WorkerClientApi for this WorkerTracker; this is only used if it could not be set in the constructor
     */
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
      if (this.__workResult) {
        throw new Error("WorkerTracker already has work");
      }
      this.__jsonWork = jsonWork;
      let workdir = path.join(this.__workerPool.getWorkDir(), jsonWork.uuid);
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
      this.__workResult.appendWorkLog(message);
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
    }
  }
});
