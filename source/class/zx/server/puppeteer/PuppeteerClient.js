/*
 * @ignore(Buffer)
 */

const puppeteer = require("puppeteer-core");

/**
 * Wraps the puppeteer instance and adds API callbacks and low level integration
 */
qx.Class.define("zx.server.puppeteer.PuppeteerClient", {
  extend: qx.core.Object,

  /**
   * Constructor
   */
  construct() {
    super();
    this.__localApis = {};
    this.__remoteApis = {};
    this.__returnCallbacks = {};
  },

  events: {
    /** Fired when an event arrives from Chromium */
    event: "qx.event.type.Data",

    /** Fired when Chromium closes */
    close: "qx.event.type.Event",

    /** Fired when Chromium sends logging output */
    log: "qx.event.type.Data",

    /** Fired when the Chromium sends a ping to show that it is still alive and working */
    ping: "qx.event.type.Event"
  },

  properties: {
    /** The URL to go to */
    url: {
      check: "String"
    },

    /** The Chromium endpoint to connect to */
    chromiumEndpoint: {
      init: null,
      nullable: true,
      check: "String"
    },

    /** Debug mode */
    debug: {
      init: false,
      check: "Boolean"
    },

    /** Username to authenticate with */
    username: {
      init: null,
      nullable: true,
      check: "String"
    },

    /** Password to authenticate with */
    password: {
      init: null,
      nullable: true,
      check: "String"
    },

    /** How long to wait for navigation, in seconds */
    navigationTimeout: {
      init: 30,
      nullable: false,
      check: "Integer"
    },

    /** Width of the page */
    viewportWidth: {
      init: 1920,
      check: "Integer"
    },

    /** Height of the page */
    viewportHeight: {
      init: 1080,
      check: "Integer"
    },

    /** Whether we allow the chromium instance to run with a GUI */
    allowHeadfull: {
      init: false,
      check: "Boolean"
    },

    /** Whether to wait for the debugger before loading a page */
    debugOnStartup: {
      init: false,
      check: "Boolean"
    }
  },

  members: {
    /** @type {import("puppeteer-core").Browser | null} */
    _browser: null,
    _page: null,
    __localApis: null,
    __remoteApis: null,
    __returnCallbacks: null,
    __serialNo: 0,
    __closed: false,

    /**
     * @Override
     */
    toString() {
      let str = super.toString();
      let endpoint = this.getChromiumEndpoint();
      if (endpoint) {
        str += " " + endpoint;
      }
      return str;
    },

    /**
     * Starts the connection to the Chromium instance in docker, completes only when the
     * page is loaded and ready to respond.  The page is required to instantiate an
     * instance of `zx.thin.puppeteer.HeadlessPage` which will be used to communicate
     * with this instance of zx.server.puppeteer.PuppeteerClient, including calling API
     * methods and sending events
     */
    async start() {
      if (this._browser) {
        throw new Error("Cannot start more than once");
      }

      let opts = {
        browserWSEndpoint: this.getChromiumEndpoint(),
        defaultViewport: {
          width: this.getViewportWidth(),
          height: this.getViewportHeight(),
          isLandscape: true
        }
      };

      if ((this.isDebug() && this.isAllowHeadfull()) || (qx.core.Environment.get("qx.debug") && qx.core.Environment.get("zx.docker.useLocalContainer"))) {
        opts.headless = false;
        opts.slowMo = 200;
        opts.devtools = true;
      }

      opts.args = ["--no-sandbox", "--disable-setuid-sandbox"];

      /** @type {Promise<import("puppeteer-core").Browser>} */
      const startup = async () => {
        const maxPasses = 10;
        for (let pass = 0; true; pass++) {
          try {
            console.log(`[attempt:${pass}/${maxPasses}] connecting to puppeteer - opts: ${JSON.stringify(opts, null, 2)}`);
            return await puppeteer.connect(opts);
          } catch (ex) {
            pass++;
            if (pass > maxPasses) {
              throw ex;
            }
            await new Promise(res => setTimeout(res, pass * 1000));
          }
        }
      };

      this._browser = await startup();

      this.info("Started Puppeteer - " + this.getChromiumEndpoint().replace(/^ws:/, "http:"));

      let result = null;

      let page = (this._page = await this._browser.newPage());

      console.log("new page viewport", { width: this.getViewportWidth(), height: this.getViewportHeight() });
      page.setViewport({ width: this.getViewportWidth(), height: this.getViewportHeight() });
      let url = this.getUrl();

      let username = this.getUsername();
      let password = this.getPassword();
      if (username && password) {
        var authHeader = new Buffer.from(username + ":" + password).toString("base64");
        if (url.indexOf("?") > -1) {
          url += "&";
        } else url += "?";
        url += "X-Authorization=Basic%20" + authHeader + "&X-Auth-Login=true";
        console.log("Setting auth header Basic " + authHeader);
      }

      page.setDefaultNavigationTimeout(0);

      // Catch console log messages so that we can read the protocol
      page.on("console", msg => this._onConsole(msg));

      // Catch all failed requests like 4xx..5xx status codes
      page.on("requestfailed", request => {
        this.error(`Request failed for url ${request.url()}: ${request.failure().errorText}`);
      });

      // Catch console log errors
      page.on("pageerror", err => {
        this.error(`Page error: ${err.toString()}`);
      });

      page.on("close", () => {
        this.__abortAll();
        this.fireEvent("close");
      });

      this.__readyPromise = new qx.Promise();

      if (this.isDebugOnStartup()) {
        url = `http://127.0.0.1:9000/dev/puppeteer-debug-corral?redirect=${encodeURIComponent(url)}`;
      }
      console.log("Going to " + url);
      let response;
      try {
        response = await page.goto(url, {
          waitUntil: "networkidle0",
          timeout: 0
        });
      } catch (e) {
        debugger;
      }

      console.log(" ********** At " + url);

      if (response.status() != 200) {
        result = {
          status: "error",
          type: "status",
          statusCode: response.status(),
          statusText: response.statusText(),
          url: this.getUrl()
        };

        throw new Error("Page navigation error : " + JSON.stringify(result, null, 2));
      } else {
        this.__sentParentReady = true;
        await this._postMessage("parent-ready");
      }

      return result;
    },

    /**
     * Aborts everything and shuts down
     *
     * @returns
     */
    __abortAll() {
      if (this.__closed) {
        return;
      }
      if (this.__readyPromise != null) {
        this.__readyPromise.reject(new Error("Aborted"));
      }
      this.__closed = true;
      let callbacks = this.__returnCallbacks;
      this.__returnCallbacks = null;
      Object.keys(callbacks).forEach(serialNo => {
        let pending = callbacks[serialNo];
        if (pending.timeoutId) {
          clearTimeout(pending.timeoutId);
          pending.timeoutId = null;
        }
        if (pending.exceptionCallback) {
          pending.exceptionCallback(new Error("Closing the puppeteer connection"));
        }
      });
    },

    /**
     * Gracefully shuts down the connection and lets go of the chromium
     */
    async stop() {
      this._page = null;
      try {
        await this._browser.disconnect();
      } catch (ex) {
        this.error("Error while closing browser during stop: " + ex);
      }
      this._browser = null;
    },

    /**
     * Kills the browser
     */
    async kill() {
      this._page = null;
      if (this._browser) {
        try {
          this._browser.disconnect();
          //this._browser.close();
        } catch (ex) {
          this.warn("Error while closing browser during kill: " + ex);
        }
        this._browser = null;
      }
    },

    /**
     * Returns the page
     *
     * @returns
     */
    getPage() {
      return this._page;
    },

    /**
     * Waits until the other side is ready
     */
    async waitForReadySignal() {
      await this.__readyPromise;
    },

    /**
     * Adds a local API, ie an API that can be called from the HeadlessPage
     *
     * @param {String} name
     * @param {zx.server.puppeteer.LocalApi} api
     */
    addLocalApi(name, api) {
      if (this.__localApis[name]) {
        this.warn(`Replacing Local API ${name} ${this.__localApis[name]} with ${api}`);
      }

      this.__localApis[name] = api;
    },

    /**
     * Creates and caches an instance of a remote API
     *
     * @param {qx.Class} clazz
     * @returns {zx.server.puppeteer.AbstractServerApi}
     */
    createRemoteApi(clazz) {
      let api = this.__remoteApis[clazz.classname];
      if (!api) {
        api = new clazz(this);
        this.__remoteApis[api.getNamespace() || clazz.classname] = api;
      }
      return api;
    },

    /**
     * Called when a console message is received; this can contain encoded messages that
     * describe method calls and events
     *
     * @param {*} msg
     */
    _onConsole(msg) {
      const PREFIX = "[[__ZX_PUPPETEER_START__]]";
      const SUFFIX = "[[__ZX_PUPPETEER_END__]]";

      let str = msg.text();
      str = str.replace(/\[\[__GRASSHOPPER/g, "[[__ZX_PUPPETEER");
      if (str.startsWith(PREFIX)) {
        if (!str.endsWith(SUFFIX)) {
          this.error("Cannot interpret console message: " + str);
          return;
        }
        str = str.substring(PREFIX.length, str.length - SUFFIX.length);
        var json;
        try {
          json = JSON.parse(str);
        } catch (ex) {
          this.error("Cannot parse console message payload: " + ex + ", string=" + str);

          return;
        }
        return this._onReceiveMessage(json);
      }
      if (this.isDebug()) {
        console.log("PAGE LOG: ", new Date(), ": ", msg.text());
      }
      const TYPES = {
        log: "info",
        error: "error",
        warn: "warn",
        debug: "debug"
      };

      var type = TYPES[msg.type()] || "info";
      str = "PUPPET CONSOLE: " + str;
      if (this.fireDataEvent("log", { type: type, msg: str }, null, true)) {
        this[type](str);
      }
    },

    /**
     * Called to receive a message decoded from the console message
     *
     * @param {*} data
     */
    _onReceiveMessage(data) {
      if (data.signature != "zx.thin.puppeteer.HeadlessPage") {
        return;
      }
      var result = null;
      if (this.__closed) {
        return;
      }

      this.fireEvent("ping");

      if (data.type == "return") {
        var pending = this.__returnCallbacks[data.serialNo];
        if (pending === undefined) {
          this.error("Cannot find return callback with serialNo " + data.serialNo);
        } else {
          if (pending.timeoutId) {
            clearTimeout(pending.timeoutId);
            pending.timeoutId = null;
          }
          delete this.__returnCallbacks[data.serialNo];
          if (data.error !== undefined) {
            this.error("Exception raised in puppet: " + data.error);
            if (pending.exceptionCallback) {
              result = pending.exceptionCallback(new Error(data.error));
            } else {
              this.error("Uncaught exception returned from " + pending.data.methodName);
            }
          } else {
            if (pending.returnCallback) {
              result = pending.returnCallback(data.value);
            }
          }
        }
      } else if (data.type == "event") {
        this._onReceiveEvent(data.event);
      } else if (data.type == "api-error") {
        this._onApiError(data.error);
      } else {
        this.error("Unexpected return message: " + JSON.stringify(data));
      }
    },

    /**
     * Called when there is a timeout when posting to the HeadlessPage
     *
     * @param {*} msg
     */
    _onTimeoutCallback(msg) {
      let callbackData = this.__returnCallbacks[msg.serialNo];
      delete this.__returnCallbacks[msg.serialNo];
      if (callbackData.exceptionCallback) {
        let err = new Error(`Timeout in callback for _postMessage(type=${msg.type}, methodName=${callbackData.data.methodName}) for message #${msg.serialNo}`);

        err.code = "ETIMEOUT";
        callbackData.exceptionCallback(err);
      } else {
        this.error(`Uncaught timeout in callback for _postMessage(type=${msg.type}, methodName=${callbackData.data.methodName}) for message #${msg.serialNo}`);
      }
    },

    /**
     * Calls a remote API
     *
     * @param options {Map} containing:
     *  namespace
     *  methodName
     *  args
     *  timeout
     */
    async callRemoteApi(options) {
      var callback = null;
      let args = options.args.filter(arg => {
        if (typeof arg !== "function") {
          return true;
        }
        callback = arg;
      });

      let result = undefined;
      try {
        result = await this._postMessageAndCapture("call", {
          namespace: options.namespace,
          methodName: options.methodName,
          args: args,
          timeout: options.timeout || null
        });
      } catch (ex) {
        if (callback) {
          callback(null, ex);
        }
        throw ex;
      }
      if (callback) {
        callback(result);
      }
      return result;
    },

    /**
     * Posts a message; this is the most common usage because it will properly queue and
     * handle the response
     *
     * @param {*} type
     * @param {*} data
     */
    async _postMessageAndCapture(type, data) {
      var msg = { serialNo: this.__serialNo++, type: type, data: data };
      let promise = new qx.Promise();
      let callbackData = (this.__returnCallbacks[msg.serialNo] = {
        returnCallback: result => promise.resolve(result),
        exceptionCallback: err => promise.reject(err),
        data
      });

      if (data.timeout > 0) {
        callbackData.timeoutId = setTimeout(() => this._onTimeoutCallback(msg), data.timeout);
      }

      msg.signature = "zx.thin.puppeteer.HeadlessPage";

      let strMsg = JSON.stringify(msg);
      try {
        /**
         * @preserve
         * javascript-obfuscator:disable
         */
        await this._page.evaluate(msg => {
          window.postMessage(msg, "*");
        }, strMsg);
        /**
         * @preserve
         * javascript-obfuscator:enable
         */
      } catch (ex) {
        this.error(`Error in _postMessageAndCapture(type=${type}) for message #${msg.serialNo}: ${ex}`);

        if (callbackData.timeoutId) {
          clearTimeout(callbackData.timeoutId);
        }
        delete this.__returnCallbacks[msg.serialNo];
        throw ex;
      }

      await promise;
    },

    /**
     * Posts a message and ignores the response
     *
     * @param {*} type
     * @param {*} data
     */
    async _postMessage(type, data) {
      var msg = { serialNo: this.__serialNo++, type: type, data: data, signature: "zx.thin.puppeteer.HeadlessPage" };
      let strMsg = JSON.stringify(msg);
      try {
        /**
         * @preserve
         * javascript-obfuscator:disable
         */
        await this._page.evaluate(msg => {
          window.postMessage(msg, "*");
        }, strMsg);

        /**
         * @preserve
         * javascript-obfuscator:enable
         */
      } catch (ex) {
        this.error(`Error in _postMessage(type=${type}) for message #${msg.serialNo}: ${ex}`);
        throw ex;
      }
    },

    /**
     * Called to receive an event from the HeadlessPage
     *
     * @param {*} event
     * @returns
     */
    _onReceiveEvent(event) {
      this.fireDataEvent("event", event);

      switch (event.type) {
        case "ready":
          if (this.__readyPromise) {
            this.__readyPromise.resolve();
            this.__readyPromise = null;
          }
          break;

        case "loaded":
          // If we receive the "loaded" event but we have already sent "parent-ready", then the puppet page
          //  was not ready to receive the message and will not have processed it; we need to send it again
          if (this.__sentParentReady) {
            return this._postMessage("parent-ready");
          }
          break;

        case "api-call":
          return this._onReceiveLocalApiCall(event.data);

        case "api-event":
          return this._onReceiveRemoteApiEvent(event.data);

        case "shutdown":
          return this._onReceiveShutdown();
      }
    },

    /**
     * Called when the API raised an exception
     */
    _onApiError(error) {
      this.error("Client failed to process message: " + error);
    },

    /**
     * Called when the HeadlessPage wants to call a LocalApi
     *
     * @param {*} data
     */
    async _onReceiveLocalApiCall(data) {
      let api = this.__localApis[data.namespace];
      let result = {
        id: data.id
      };

      if (!api) {
        this.error(`Cannot find API called ${data.namespace}`);
        result.exception = new Error(`Cannot find API called ${data.namespace}`);
      } else {
        try {
          result.result = await api.callMethod(data.methodName, data.args);
        } catch (ex) {
          this.error(`Error during call to API ${data.namespace}.${data.methodName}()`);

          result.exception = ex;
        }
      }

      await this._postMessage("api-return", result);
    },

    /**
     * Called when the remote API sends an event
     * @param {*} event
     * @returns
     */
    _onReceiveRemoteApiEvent(event) {
      let api = this.__remoteApis[event.namespace];
      if (!api) {
        this.warn(`Received event for ${event.namespace}.${event.name} but could not find a remote API`);

        return;
      }
      api.receiveEvent(event.name, event.data);
    },

    /**
     * Called when the HeadlessPage is shutting down
     */
    _onReceiveShutdown() {},

    /**
     * Takes a screenshot as PNG
     *
     * @param {String} outputTo filename to save to
     * @returns
     */
    async screenshot(outputTo) {
      let opts = {
        path: outputTo,
        imageType: "png",
        clip: {
          x: 0,
          y: 0,
          width: this.getViewportWidth(),
          height: this.getViewportHeight()
        }
      };

      return this._page.screenshot(opts);
    },

    /**
     * Prints a PDF
     *
     * @param {String} outputTo filename to print to
     * @returns
     */
    async printToPdf(outputTo) {
      return await this._page.pdf({ path: outputTo, format: "A4" });
    },

    /**
     * Outputs an error message
     *
     * @param {String} msg message to output
     */
    error(msg) {
      if (this.fireDataEvent("log", { type: "error", msg: msg }, null, true)) {
        super.error(msg);
      }
    }
  }
});
