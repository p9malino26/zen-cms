qx.Class.define("zx.server.work.Worker", {
  extend: qx.core.Object,
  implement: [zx.server.work.IWorker],

  construct() {
    super();
    this.__serverApi = new zx.io.api.server.GenericServerApiProxy(zx.server.work.IWorkerApi, this);
  },

  destruct() {
    this.__serverApi.dispose();
  },

  properties: {
    /** URL to access Chromium, if one is available */
    chromiumUrl: {
      init: null,
      nullable: true,
      check: "String"
    }
  },

  members: {
    __workJson: null,

    /**
     * Returns the Server API for this worker
     *
     * @returns {zx.server.work.IWorkerApi}
     */
    getServerApi() {
      return this.__serverApi;
    },

    /**
     * Called to append to the log of the work, and is also published to the WorkerPool
     */
    appendWorkLog(message) {
      this.log(message);
      this.__serverApi.publish("log", { caller: this.__workJson.uuid, message });
    },

    /**
     * @Override
     */
    async run(workJson) {
      if (this.__workJson) {
        throw new Error("Cannot run more than one work at a time");
      }
      let clazz = qx.Class.getByName(workJson.classname);
      if (!clazz) {
        throw new Error(`Cannot find class '${workJson.classname}'`);
      }
      if (!qx.Class.hasInterface(clazz, zx.server.work.IWork)) {
        throw new Error(`Class '${workJson.classname}' does not implement interface zx.server.work.IWork !`);
      }

      let workInstance = new clazz(...(workJson.args || []));
      this.__workJson = workJson;
      workInstance.setExplicitUuid(workJson.uuid);

      let uuid = workJson.uuid;
      try {
        let message = await workInstance.execute(this);
        this.__serverApi.publish("complete", { caller: uuid, success: true, message });
      } catch (cause) {
        this.error(`[${workInstance.classname}:${uuid}] EXCEPTION: ${cause.message}`);
        this.__serverApi.publish("complete", { caller: uuid, success: false, message: cause.message });
      } finally {
        this.__workJson = null;
      }
    }
  }
});
