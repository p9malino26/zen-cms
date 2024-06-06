/**
 * This mixin provides a simple logging mechanism.
 * The object that includes this mixin can append logs into its log buffer using `this.log`.
 * The log buffer can be retrieved using `getLogOutput`.
 */
qx.Mixin.define("zx.utils.MConsoleLog", {
  construct() {
    this.__logOutput = [];
  },
  /**
   * If we want the log output to be printed to the console.
   */
  properties: {
    logOutputToConsole: {
      init: false,
      check: "Boolean"
    }
  },

  events: {
    /**
     * Fired when `this.log` was called
     */
    log: "qx.event.type.Data"
  },

  members: {
    /** @type {string[]} the output lines */
    __logOutput: null,

    /**
     * Pushes a lines into the output
     *
     * @param {string} str the line to add
     */
    log(str) {
      this.__logOutput.push(str);
      if (this.getLogOutputToConsole()) {
        console.log(str);
      }
      this.fireDataEvent("log", { message: str });
    },

    /**
     * Returns the logged output as one string
     *
     * @returns {String}
     */
    getLogOutput() {
      return this.__logOutput.join("\n");
    }
  }
});
