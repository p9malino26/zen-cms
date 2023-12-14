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
 * A Demonstrator is capable of having a UI to demonstrate the feature or functionality,
 * potentially to be driven by an external test runner for interactive UI tests; it can
 * also support a series of unit tests.  It is not a requirement that UI or unit tests are
 * present (you can have one or the other or both).
 *
 * A Demonstrator can be compiled into an application to be used directly by a DemoRunner
 * application, or could be compiled into a separate application on it's own to be used
 * by an instance of DemonstratorApp, in which case the application will be inside an iframe
 * and remote controlled by an instance of DemoRunner in a parent window.
 *
 * @use(zx.app.demo.DemonstratorProxy)
 */
qx.Class.define("zx.app.demo.Demonstrator", {
  extend: qx.core.Object,

  construct() {
    super();
    this.setName(this.classname);
    this.__log = "";
  },

  properties: {
    name: {
      check: "String",
      event: "changeName"
    },

    /** Whether the root widget is currently active on screen */
    active: {
      init: false,
      check: "Boolean",
      nullable: false,
      apply: "_applyActive"
    }
  },

  events: {
    /** Fired when a log message is output */
    log: "qx.event.type.Event"
  },

  members: {
    /** @type{Object[]} log entries */
    __log: null,

    /** @type{qx.ui.core.LayoutItem} the root widget, if there is one.  Can be undefined or null */
    __uiRoot: undefined,

    /** @type{Boolean} whether the `resetDemo()` method is supported */
    _supportsReset: false,

    /** @type{Boolean} whether there is an embedded iframe which has unit tests */
    _supportsEmbeddedUnitTests: false,

    /** @type{zx.io.remote.NetworkController} controller for communication with embedded window, created on demand */
    __windowIoController: null,

    /**
     * Detects whether the demonstrator can be reset
     * @returns {Boolean}
     */
    getSupportsReset() {
      return this._supportsReset;
    },

    /**
     * Called once, when the demonstrator is first shown
     */
    initialise() {
      // Nothing
    },

    /**
     * Adds a log entry
     *
     * @param {String} msg
     */
    log(msg) {
      if (!this.__log) {
        this.__log = [];
      }
      this.__log.push({
        msg: msg,
        when: new Date()
      });

      this.fireEvent("log");
    },

    /**
     * Called to capture logging from an iframe
     *
     * @param {String} url URL of the iframe
     * @param {Boolean?} enable if false, then stop capturing, if true or not provided, start capturing
     */
    _captureLogs(url, enable) {
      if (enable === false) {
        zx.utils.PostMessageRelayLogger.addOriginCallback(url, null);
      } else
        zx.utils.PostMessageRelayLogger.addOriginCallback(url, data => {
          this.log("IFRAME: " + data.message);
        });
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
      if (!this.__log) {
        return [];
      }
      return this.__log;
    },

    /**
     * Apply Method
     */
    _applyActive(value) {
      // Nothing
    },

    /**
     * Returns the root of the widget UI, if there is one
     *
     * @returns {qx.ui.core.LayoutItem?}
     */
    getUiRoot() {
      if (this.__uiRoot === undefined) {
        this.__uiRoot = this._createUiRoot();
      }
      return this.__uiRoot;
    },

    /**
     * Called internally to create the UI root, if there is one
     *
     * @returns {qx.ui.core.LayoutItem?} null if no uiRoot
     */
    _createUiRoot() {
      return null;
    },

    /**
     * Called to reset the demonstrator; only called if `_supportsReset` is set to true
     */
    async resetDemo() {
      if (this.__windowIoController) {
        this.__windowIoController.dispose();
        this.__windowIoController = null;
      }
    },

    /**
     * Creates a controller for comms with an embedded window on demand, reusing the result
     *
     * @returns {zx.io.remote.NetworkController} the controller for comms with an embedded window
     */
    getWindowIoController() {
      if (!this.__windowIoController) {
        // Controller manages the objects and their serialisation
        this.__windowIoController = new zx.io.remote.NetworkController();

        // Listener is specific to a given platform (postMessage, Xhr, etc)
        new zx.io.remote.WindowListener(this.__windowIoController);
      }

      return this.__windowIoController;
    },

    /**
     * Returns a list of test names
     *
     * @return {String[]}
     */
    async getTestNames() {
      let names = Object.keys(this.constructor.prototype).filter(name => name.length > 4 && name.startsWith("test") && name[4] === name[4].toUpperCase());

      if (this._supportsEmbeddedUnitTests) {
        if (!this.__proxyNames) {
          let ctlr = this.getWindowIoController();
          this.__proxy = await ctlr.getUriMappingAsync("zx.app.demo.DemonstratorProxy");

          this.__proxyNames = await this.__proxy.getTestNames();
        }
        this.__proxyNames.forEach(name => names.push(name));
      }
      return names;
    },

    /**
     * Runs a specific test
     *
     * @param name {String} the name of the test (returned by `getTestNames`)
     * @return {zx.app.demo.TestResult} the result of the test (use `await result.promiseComplete()`)
     */
    runTest(name) {
      let result = new zx.app.demo.TestResult().set({
        testClassname: this.classname,
        testName: name
      });

      const runTestImpl = async () => {
        if (this._supportsEmbeddedUnitTests && this.__proxyNames.indexOf(name) > -1) {
          result.log("Starting remote test");
          result.setPhase("test");
          let proxyResult = await this.__proxy.runTest(name);
          result.importLog(proxyResult.log);
          result.log("Remote test completed");
          result.set({ status: proxyResult.status, phase: null });
          return;
        }

        try {
          result.log("Starting test");
          if (typeof this.setUp == "function") {
            result.setPhase("setUp");
            await this.setUp(result);
          }

          result.setPhase("test");
          await this[name](result);

          if (typeof this.tearDown == "function") {
            result.setPhase("tearDown");
            await this.tearDown(result);
          }

          result.log("Test complete");
          result.set({ status: "ok", phase: null });
        } catch (ex) {
          result.log("Exception occured: " + ex.stack || ex);
          result.set({ status: "failed", phase: null });
        }
      };

      runTestImpl();

      return result;
    },

    /**
     * Runs all tests
     *
     * @return {zx.app.demo.TestResult[]} all the test results
     */
    async runAllTests() {
      let results = [];
      for (let names = this.getTestNames(), i = 0; i < names.length; i++) {
        let result = await this.runTest(names[i]);
        results.push(result);
      }
      return results;
    }
  }
});
