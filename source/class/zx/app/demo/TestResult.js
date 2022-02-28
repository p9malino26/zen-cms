/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2022 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */


/**
 * When a test is run, it is given an instance of TestResult to store its results in
 */
qx.Class.define("zx.app.demo.TestResult", {
  extend: qx.core.Object,

  properties: {
    /**
     * The name of the class that the test is in
     */
    testClassname: {
      check: "String",
      event: "changeTestClassname"
    },

    /**
     * The name of the test
     */
    testName: {
      check: "String",
      event: "changeTestName"
    },

    /**
     * Status of the test, null if not started
     */
    status: {
      init: null,
      nullable: true,
      check: ["ok", "failed"],
      event: "changeStatus"
    },

    /**
     * Phase of the test
     */
    phase: {
      init: null,
      nullable: true,
      check: ["setUp", "test", "tearDown"],
      event: "changePhase",
      apply: "_applyPhase"
    }
  },

  events: {
    /** Fired when a log entry is added, use `.takeLog()` to get the log entries */
    log: "qx.event.type.Event"
  },

  members: {
    /** @type{Object[]} log entries */
    __log: null,

    /** @type{qx.Promise} when complete */
    __promiseComplete: null,

    /**
     * Apply method
     */
    _applyPhase(value) {
      if (!value) {
        if (this.__promiseComplete) {
          this.__promiseComplete.resolve();
          this.__promiseComplete = null;
        }
      } else {
        if (this.__promiseComplete) {
          this.__promiseComplete.reject();
          this.__promiseComplete = null;
        }
        this.__promiseComplete = new qx.Promise();
      }
    },

    /**
     * Adds a log entry
     *
     * @param {String} msg
     */
    log(msg) {
      if (!this.__log) this.__log = [];
      this.__log.push({
        msg: msg,
        phase: this.getPhase(),
        when: new Date()
      });
    },

    /**
     * Imports a log, eg from a remote unit test
     *
     * @param {Object[]} log
     */
    importLog(log) {
      if (!this.__log) this.__log = [];
      log.forEach(entry => this.__log.push(entry));
    },

    /**
     * Clears the log
     */
    clearLog() {
      this.__log = null;
    },

    /**
     * Gets the log
     *
     * @returns {Object[]}
     */
    getLog() {
      if (!this.__log) return [];
      return this.__log;
    },

    /**
     * Promise that completes when the phase returns to null
     *
     * @returns {qx.Promise}
     */
    promiseComplete() {
      return this.__promiseComplete;
    },

    /**
     * @Override
     */
    toString() {
      return this.getTestClassname + "." + this.getTestName();
    }
  }
});
