/**
 * WorkResult captures the Work results - status and log files; it can persist itself so that a WorkerPool can
 * store it until the Scheduler is ready to collect the results
 */
qx.Class.define("zx.server.work.WorkResult", {
  extend: qx.core.Object,

  construct() {
    super();
  },

  statics: {
    __DF_LOG: new qx.util.format.DateFormat("yyyy-MM-dd HH:mm:ss")
  },

  members: {
    /** @type{*?} the currently running work */
    __jsonWork: null,

    /** @type{String} the path for storing anythign to do with the Work being run by the Worker (eg log files) */
    __workdir: null,

    /** @type{WriteStream} where to write logs for the Work */
    __logStream: null,

    /** @type{*} JSON status that is written into the workdir */
    __workStatus: null,

    /**
     * Called when starting the work to capture the results
     */
    async initialise(workdir, jsonWork) {
      this.__workdir = workdir;
      this.__jsonWork = jsonWork;
      await fs.mkdir(this.__workdir, { recursive: true });
      this.__logStream = fs.createWriteStream(path.join(this.__workdir, "log.txt"));
      this.__workStatus = {
        started: new Date(),
        logFile: "log.txt"
      };
      this.appendWorkLog("Starting work: " + JSON.stringify(jsonWork, null, 2));
      this.writeStatus();
    },

    /**
     * Called when the work is complete
     */
    async close(response) {
      this.__workStatus.response = response;
      this.__workStatus.completed = new Date();
      fs.close(this.__logStream);
      this.__logStream = null;
      this.writeStatus();
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
     * Appends a message to the log for the Work
     *
     * @param {String} message
     */
    appendWorkLog(message) {
      this.__logStream.write(zx.server.work.WorkerResult.__DF_LOG.format(new Date()) + " " + message + "\n");
    },

    /**
     * Returns the status of the work as a JSON object; this is persisted to disk with calls
     * to `writeStatus`
     */
    getStatusJson() {
      return this.__workStatus;
    },

    /**
     * Returns the log file contents for the work
     */
    getWorkLog() {
      return fs.readFile(path.join(this.__workdir, "log.txt"), "utf8");
    },

    /**
     * Persists the __workStatus to disk
     */
    async writeStatus() {
      await fs.writeFile(path.join(this.__workdir, "status.json"), JSON.stringify(this.__workStatus, null, 2));
    },

    /**
     * @Override
     */
    toString() {
      return this.classname + " " + this.__jsonWork?.uuid + " " + this.__workdir;
    }
  }
});
