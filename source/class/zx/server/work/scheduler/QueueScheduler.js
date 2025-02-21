/**
 * A simple queue based scheduler
 *
 * @typedef WorkQueueEntry
 * @property {WorkJson} workJson the work to do
 * @property {Promise} promise the promise which resolves when the work is done
 *
 */
qx.Class.define("zx.server.work.scheduler.QueueScheduler", {
  extend: qx.core.Object,
  implement: [zx.server.work.scheduler.ISchedulerApi],

  construct() {
    super();
    this.__queue = [];
    this.__running = {};
    this.__serverApi = new zx.io.api.server.GenericServerApiProxy(zx.server.work.scheduler.ISchedulerApi, this);
  },

  events: {
    /** Fired when a work item is completed, the data is the serialized JSON from `WorkResult.serializeForScheduler` */
    workCompleted: "qx.event.type.Data"
  },

  members: {
    /** @type{WorkQueueEntry[]} the queue */
    __queue: null,

    /** @type{Object<String, WorkQueueEntry>} the running work, indexed by work UUID */
    __running: null,

    /** @type{zx.server.work.scheduler.ISchedulerApi} a server API that can be used to call this scheduler */
    __serverApi: null,

    /**
     * Adds a work item to the queue
     *
     * @param {WorkJson} workJson
     * @return {Promise} resolves when the work is completed
     */
    async pushWork(workJson) {
      if (!workJson.classname) {
        throw new Error("workJson must have a classname");
      }
      if (!workJson.uuid) {
        workJson.uuid = qx.util.Uuid.createUuidV4();
      }
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
    pollForWork() {
      if (this.__queue.length === 0) {
        return null;
      }
      let info = this.__queue.shift();
      this.__running[info.workJson.uuid] = info;
    },

    /**
     * @Override
     */
    onWorkCompleted(workResult) {
      let info = this.__running[workResult.workJson.uuid];
      delete this.__running[workResult.workJson.uuid];
      info.promise.resolve(workResult);
      this.fireDataEvent("workCompleted", workResult);
    },

    /**
     * Returns the server API for this scheduler
     *
     * @return {zx.server.work.scheduler.ISchedulerApi}
     */
    getServerApi() {
      return this.__serverApi;
    }
  }
});
