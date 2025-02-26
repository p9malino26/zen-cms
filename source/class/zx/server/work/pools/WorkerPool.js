/* ************************************************************************


 *
 *  Zen [and the art of] CMS
 *
 *  https://zenesis.com
 *
 *  Copyright:
 *    2019-2025 Zenesis Ltd, https://www.zenesis.com
 *
 *  License:
 *    MIT (see LICENSE in project root)
 *
 *  Authors:
 *    John Spackman (@johnspackman)
 *    Will Johnson (@willsterjohnsonatzenesis)
 *
 * ************************************************************************ */

const path = require("path");
const fs = require("fs");

/**
 * A worker pool maintains and manages a pool of workers
 *
 * Implementations of this class is responsible to creating and destroying those
 * processes, allocating work to them, and communicating with the scheduler to
 * receive work to do and report back the status of the work to the scheduler.
 *
 */
qx.Class.define("zx.server.work.pools.WorkerPool", {
  extend: qx.core.Object,
  implement: [zx.utils.IPoolFactory],

  construct(workdir) {
    super();

    if (!workdir) {
      workdir = zx.server.Config.resolveTemp("worker-pools/" + this.classname);
    }
    this.setWorkDir(workdir);

    this.__runningWorkTrackers = {};
    this.__workResultQueue = [];

    //let api = new zx.server.work.pools.WorkerPoolServerApi(this);
  },

  properties: {
    /**
     * Config options for the internal {@link zx.utils.Pool}
     * @type {object} config - configuration options for the pool. These can be changed at any time with the corresponding property
     * @prop {number} [config.minSize] - the minimum number of resources to keep alive in the pool (impacts idle overhead)
     * @prop {number} [config.maxSize] - the maximum number of resources to create in the pool (impacts maximum load)
     * @prop {number} [config.timeout] - the number of milliseconds to wait for a resource to become available before failing
     * @prop {number} [config.pollInterval] - the number of milliseconds between checks for available resources
     */
    poolConfig: {
      init: null,
      nullable: true,
      check: "Object",
      event: "changePoolConfig",
      apply: "_applyPoolConfig"
    },

    /** Where to persist the WorkResult and other files */
    workDir: {
      check: "String",
      apply: "_applyWorkDir"
    },

    /** Scheduler to poll from */
    schedulerApi: {
      check: "zx.server.work.scheduler.ISchedulerApi"
    },

    /** Frequency, in milliseconds, to poll the scheduler when there are spare Workers in the pool */
    pollInterval: {
      check: "Integer",
      init: 5_000,
      event: "changePollInterval"
    },

    /** Frequency, in milliseconds, to try to push completed work back to the scheduler when the scheduler is offline */
    pushInterval: {
      check: "Integer",
      init: 10_000,
      event: "changePushInterval"
    }
  },

  objects: {
    pool() {
      let pool = new zx.utils.Pool();
      pool.setFactory(this);
      pool.addListener("becomeAvailable", () => {
        this.debug("pool sent becomeAvailable");
        this.getQxObject("pollTimer").startTimer();
      });
      pool.addListener("becomeUnavailable", () => {
        this.debug("pool sent becomeUnavailable");
        this.getQxObject("pollTimer").killTimer();
      });
      pool.addListener("createResource", this.__onPoolCreateResource, this);
      pool.addListener("destroyResource", this.__onPoolDestroyResource, this);
      return pool;
    },

    pollTimer() {
      let pollTimer = new zx.utils.Timeout(null, this.__pollForNewWork, this);
      pollTimer.setRecurring(true);
      this.bind("pollInterval", pollTimer, "duration");
      return pollTimer;
    },

    pushTimer() {
      let pushTimer = new zx.utils.Timeout(null, () => this.__pushQueuedResultsToScheduler());
      this.bind("pushInterval", pushTimer, "duration");
      return pushTimer;
    }
  },

  members: {
    /** @type{zx.server.work.WorkResult[]} queue of WorkResults to send back to the scheduler */
    __workResultQueue: null,

    /** @type{Object<String,zx.server.work.WorkTracker>} WorkTrackers that are currently running Work, indexed by work UUID */
    __runningWorkTrackers: null,

    /**
     * Instruct the pool to start creating workers and polling for work
     */
    async startup() {
      let workDir = this.getWorkDir();
      await fs.promises.mkdir(workDir, { recursive: true });
      let files = await fs.promises.readdir(workDir);
      for (let file of files) {
        let fullPath = path.join(workDir, file);
        let stat = await fs.promises.stat(fullPath);
        if (stat.isDirectory()) {
          let workResult = await zx.server.work.WorkResult.loadFromDir(fullPath);
          if (workResult) {
            this.__workResultQueue.push(workResult);
          }
        }
      }
      await this.getQxObject("pool").startup();
      this.getQxObject("pollTimer").startTimer();
      this.getQxObject("pushTimer").startTimer();
    },

    /**
     * Shut down the pool and all pooled workers
     *
     * Shutdown will wait for all pending messages to send before shutting down, unless a destructiveMs is provided
     * @param {number} [forceAfterMs] - the number of milliseconds to wait before forcibly shutting down. Use any negative value to wait indefinitely. Defaults to -1.
     */
    async shutdown(forceAfterMs = -1) {
      this.getQxObject("pollTimer").killTimer();
      this.getQxObject("pushTimer").killTimer();
      await this.getQxObject("pool").shutdown();
    },

    /**
     * Apply for `poolConfig` property
     */
    _applyPoolConfig(value, oldValue) {
      let pool = this.getQxObject("pool");
      ["minSize", "maxSize", "timeout", "pollInterval"].forEach(prop => {
        let upname = qx.lang.String.firstUp(prop);
        if (value[prop] !== undefined) {
          pool["set" + upname](value[prop]);
        } else {
          pool["reset" + upname](value[prop]);
        }
      });
    },

    /**
     * Apply for `workDir` property
     */
    _applyWorkDir(value, oldValue) {
      let pool = this.getQxObject("pool");
      if (pool.getSize() > 0) {
        throw new Error("Cannot change workDir while pool is running");
      }
    },

    /**
     * Event handler for when the pool creates a new resource (a WorkTracker)
     */
    __onPoolCreateResource(evt) {
      let workerTracker = evt.getData();
      workerTracker.addListener("changeStatus", this.__onWorkTrackerStatusChange, this);
    },

    /**
     * Event handler for when the pool permanently destroys a resource (a WorkTracker)
     */
    __onPoolDestroyResource(evt) {
      let workerTracker = evt.getData();
      let workResult = workerTracker.takeWorkResult();
      if (workResult) {
        this.__workResultQueue.push(workResult);
        delete this.__runningWorkTrackers[workResult.getWorkJson().uuid];
      }
      workerTracker.removeListener("changeStatus", this.__onWorkTrackerStatusChange, this);
    },

    /**
     * Events handler for changes to a WorkTracker's status
     */
    __onWorkTrackerStatusChange(evt) {
      let status = evt.getData();
      if (status !== "dead" && status !== "stopped") {
        return;
      }
      let pool = this.getQxObject("pool");
      let workerTracker = evt.getTarget();
      let workResult = workerTracker.takeWorkResult();
      if (status === "dead") {
        pool.destroyResource(workerTracker);
      } else if (status === "stopped") {
        workerTracker.reuse();
        pool.release(workerTracker);
      }
      if (workResult) {
        this.__workResultQueue.push(workResult);
        this.getQxObject("pushTimer").startTimer();
      }
    },

    /**
     * Event handler for when we need to poll for new work
     */
    async __pollForNewWork() {
      if (!this.getQxObject("pool").available()) {
        return;
      }

      let jsonWork;
      try {
        this.debug(`polling for work...`);
        jsonWork = await this.getSchedulerApi().pollForWork();
      } catch (e) {
        this.debug(`failed to poll for work: ${e}`);
        return;
      }
      if (jsonWork) {
        this.debug(`received work!`);

        let workerTracker = await this.getQxObject("pool").acquire();
        this.__runningWorkTrackers[jsonWork.uuid] = workerTracker;
        workerTracker.runWork(jsonWork);
      }
    },

    /**
     * Called on a timer to send results back to the scheduler
     */
    async __pushQueuedResultsToScheduler() {
      while (this.__workResultQueue.length) {
        let workResult = this.__workResultQueue[0];
        let jsonResult = await workResult.serializeForScheduler();
        try {
          await this.getSchedulerApi().onWorkCompleted(jsonResult);
        } catch (ex) {
          this.error(`Failed to push work result to scheduler: ${ex}`);
          this.getQxObject("pushTimer").startTimer();
          return;
        }
        this.__workResultQueue.shift();
        workResult.deleteWorkDir();
      }
    },

    /**
     * @Override
     */
    createPoolableEntity() {
      throw new Error(`Abstract method ${this.classname}.createPoolableEntity from IPoolFactory not implemented`);
    },

    /**
     * @Override
     */
    destroyPoolableEntity(entity) {
      throw new Error(`Abstract method ${this.classname}.destroyPoolableEntity from IPoolFactory not implemented`);
    },

    /**
     *
     * @param {string} uuid
     */
    killWork(uuid) {
      if (!this.__runningWorkTrackers[uuid]) {
        throw new Error("No work with that UUID");
      }
      this.__runningWorkTrackers[uuid].killWork();
      delete this.__runningWorkTrackers[uuid];
    },

    /**
     *
     * @returns {Object} Information about all the current work that is running
     */
    getStatusJson() {
      return Object.values(this.__runningWorkTrackers).map(workerTracker => workerTracker.getWorkResult().getStatusJson());
    },

    /**
     * Get information about a current work that is running
     *
     * @param {string} uuid
     * @returns {Object}
     */
    getWorkerStatusJson(uuid) {
      let workerTracker = this.__runningWorkTrackers[uuid];
      if (!workerTracker) {
        throw new Error("No work with that UUID");
      }

      return workerTracker.getWorkResult().getStatusJson();
    }
  }
});
