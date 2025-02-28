qx.Class.define("zx.server.work.Worker", {
  extend: qx.core.Object,
  implement: [zx.server.work.IWorker],

  construct() {
    super();
    this.__serverApi = zx.io.api.ApiUtils.createServerApi(zx.server.work.IWorkerApi, this);
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

  events: {
    /** Fired when we are asked to shutdown (eg by the WorkerPool) */
    shutdown: "qx.event.type.Event"
  },

  members: {
    __workJson: null,
    __chromium: null,

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
      this.info(message);
      this.__serverApi.publish("log", { caller: this.__workJson.uuid, message });
    },

    /**
     * @Override
     */
    async run(workJson) {
      if (this.__workJson) {
        throw new Error("Cannot run more than one work at a time");
      }
      let workId = `${workJson.classname} [${workJson.uuid}]`;
      this.debug("Running work: " + workId);
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
      let response = {
        returnValue: null,
        exception: null
      };
      try {
        response.returnValue = await workInstance.execute(this);
        this.debug(`${workId} completed successfully, result = ${response.returnValue}`);
        this.__serverApi.publish("complete", { caller: uuid, success: true, response });
      } catch (ex) {
        response.exception = ex.message || ex + "";
        response.exceptionStack = qx.dev.StackTrace.getStackTraceFromError(ex).join(", ");
        this.error(`${workId} EXCEPTION: ${ex.message}`, ex);
        this.__serverApi.publish("complete", { caller: uuid, success: false, response });
      } finally {
        this.__workJson = null;
      }
      return response;
    },

    /**
     * @Override
     */
    shutdown() {
      this.fireEvent("shutdown");
    },

    /**
     * Returns the IChromium instance for this worker, if one is available
     *
     * @returns {zx.server.puppeteer.IChromium}
     */
    async getChromium() {
      if (this.__chromium) {
        return this.__chromium;
      }
      if (!this.getChromiumUrl()) {
        return null;
      }
      this.__chromium = new zx.server.work.WorkerChromium(this.getChromiumUrl());
      await this.__chromium.initialise();
      return this.__chromium;
    }
  }
});
