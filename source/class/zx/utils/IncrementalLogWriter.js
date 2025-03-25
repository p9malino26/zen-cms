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
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */

const fs = require("fs");

/**
 * Helper class to write log messages to a file incrementally.  The write is handled by a debounced method
 * to avoid writing to disk too frequently and to avoid async methods in the main thread
 */
qx.Class.define("zx.utils.IncrementalLogWriter", {
  extend: qx.core.Object,

  construct(filename) {
    super();
    this.__unwrittenLog = "";
    if (filename) {
      this.setFilename(filename);
    }
    this.__debouncedWriteLog = new zx.utils.Debounce(() => this.__writeLog(), 500);
  },

  properties: {
    /** Where to write the log to */
    filename: {
      check: "String",
      event: "changeFilename"
    }
  },

  members: {
    /** @type{zx.utils.Debounced} debouncer used for writing the console log */
    __debouncedWriteLog: null,

    /** @type{String} console output, waitying to be written to disk */
    __unwrittenLog: null,

    /**
     * Called for each line of output from the node process
     *
     * @param {String} message
     */
    write(message) {
      if (this.__unwrittenLog === null) {
        this.__unwrittenLog = "";
      }
      this.__unwrittenLog += message;
      this.__debouncedWriteLog.run();
    },

    /**
     * Reads the entire log file
     *
     * @returns {String} the log
     */
    async read() {
      return await fs.promises.readFile(this.getFilename(), "utf8");
    },

    /**
     * Debounced method to write the console log to disk
     */
    async __writeLog() {
      let log = this.__unwrittenLog;
      if (log !== null) {
        this.__unwrittenLog = null;
        try {
          await fs.promises.writeFile(this.getFilename(), log, { flag: "a" });
        } catch (ex) {
          this.debug(`Error writing log file ${this.getFilename()}: ${ex}`);
        }
      }
    }
  }
});
