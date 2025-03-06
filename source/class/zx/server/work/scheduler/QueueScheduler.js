const fs = require("fs");
const path = require("path");

/**
 * A simple queue based scheduler
 *
 * @typedef WorkQueueEntry
 * @property {WorkJson} workJson the work to do
 * @property {Promise} promise the promise which resolves when the work is done
 *
 *
 * @use(zx.io.api.client.AbstractClientApi)
 */
qx.Class.define("zx.server.work.scheduler.QueueScheduler", {
  extend: qx.core.Object,
  implement: [zx.server.work.scheduler.ISchedulerApi],

  construct(workDir) {
    super();
    this.__queue = [];
    this.__running = {};
    this.__workDir = workDir;
    this.__serverApi = zx.io.api.ApiUtils.createServerApi(zx.server.work.scheduler.ISchedulerApi, this);
  },

  events: {
    /** Fired when a work item is started, the data is the serialized JSON from `WorkResult.serializeForScheduler` */
    workStarted: "qx.event.type.Data",

    /** Fired when a work item is completed, the data is the serialized JSON from `WorkResult.serializeForScheduler` */
    workCompleted: "qx.event.type.Data",

    /** Fired when there is no work to do */
    noWork: "qx.event.type.Event"
  },

  members: {
    /** @type{String?} the directory to store work results */
    __workDir: null,

    /** @type{WorkQueueEntry[]} the queue */
    __queue: null,

    /** @type{Object<String, WorkQueueEntry>} the running work, indexed by work UUID */
    __running: null,

    /** @type{zx.server.work.scheduler.ISchedulerApi} a server API that can be used to call this scheduler */
    __serverApi: null,

    /**
     * Starts the scheduler
     */
    async startup() {
      if (this.__workDir) {
        await fs.promises.mkdir(this.__workDir, { recursive: true });
      }
    },

    /**
     * Adds a work item to the queue
     *
     * @param {WorkJson} workJson
     * @return {Promise} resolves when the work is completed
     */
    async pushWork(workJson) {
      if (!workJson.workClassname) {
        throw new Error("workJson must have a workClassname");
      }
      if (!workJson.uuid) {
        workJson.uuid = qx.util.Uuid.createUuidV4();
      }
      this.debug(`Queuing job ${workJson.uuid} of type ${workJson.workClassname}`);
      let promise = new qx.Promise();
      this.__queue.push({
        workJson,
        promise
      });
      await promise;
    },

    /**
     * @Override
     */
    async pollForWork() {
      if (this.__queue.length === 0) {
        this.fireEvent("noWork");
        return null;
      }
      let info = this.__queue.shift();
      this.__running[info.workJson.uuid] = info;
      await this.fireDataEventAsync("workStarted", info.workJson);
      return info.workJson;
    },

    /**
     * @Override
     */
    async onWorkCompleted(workResultData) {
      this.debug(`Work completed for job ${workResultData.workJson.uuid}`);
      let info = this.__running[workResultData.workJson.uuid];
      if (info) {
        delete this.__running[workResultData.workJson.uuid];
        info.promise.resolve(workResultData);
        await this.fireDataEventAsync("workCompleted", workResultData);
      } else {
        this.debug(`Work completed for job ${workResultData.workJson.uuid} but not found in running list (Worker Pool has queued this work)`);
      }
      const archiveIt = async () => {
        let workDir = path.join(this.__workDir, workResultData.workJson.uuid);
        await fs.promises.mkdir(workDir, { recursive: true });
        let workResult = zx.server.work.WorkResult.deserializeFromScheduler(workDir, workResultData);
      };
      if (this.__workDir) {
        archiveIt();
      }
    },

    /**
     * Returns the server API for this scheduler
     *
     * @return {zx.server.work.scheduler.ISchedulerApi}
     */
    getServerApi() {
      return this.__serverApi;
    },

    /**
     * Returns the working directory, used for logs etc
     *
     * @returns {String?} the directory to store work results
     */
    getWorkDir() {
      return this.__workDir;
    },

    /**
     * Returns the queue size
     *
     * @returns {Number} the number of items in the queue
     */
    getQueueSize() {
      return this.__queue.length;
    },

    /**
     * Returns the number of tasks currently running
     *
     * @returns {Number} the number of items running
     */
    getRunningSize() {
      return Object.keys(this.__running).length;
    }
  }
});
