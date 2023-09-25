/**
 * Represents an API inside Chromium/Puppeteer
 *
 * Derive from this class on the server side to implement an API that can be called inside
 * the Puppeteer instance; specify a list of method names in the constructor, and they will
 * be added to this instance - eg a method called "foo" will be available as "foo()" on this.
 *
 * You can also define events which can be fired from the Puppeteer instance and received
 * on this instance.
 *
 * All methods are asynchronous and return a Promise.
 */
qx.Class.define("zx.server.puppeteer.AbstractRemoteApi", {
  extend: qx.core.Object,

  /**
   * Constructor
   *
   * @param {zx.server.puppeteer.PuppeteerClient} puppeteer to attach to
   * @param {String[]} methods list of method names to add
   */
  construct(puppeteer, methods) {
    super();
    this.__puppeteer = puppeteer;
    this.__methodConfigs = {};
    this.__pendingCalls = [];
    if (methods) {
      if (qx.lang.Type.isArray(methods)) {
        methods.forEach(methodName => this._addMethod(methodName));
      } else {
        for (let methodName in methods) {
          this._addMethod(methodName, methods[methodName]);
        }
      }
    }
  },

  properties: {
    /** Namespace for all API methods */
    namespace: {
      init: null,
      nullable: true,
      check: "String"
    }
  },

  members: {
    /** @type{zx.server.puppeteer.PuppeteerClient} the puppeteer instance */
    __puppeteer: null,

    /**
     * @typedef MethodConfig
     * @property {String} methodName name of the method
     * @property {Number?} timeout timeout in ms for the method call
     *
     * @type{Object<String,MethodConfig>} configuration for each method
     */
    __methodConfigs: null,

    /** @type{Promise[]} list of promises that have yet to resolve from method calls */
    __pendingCalls: null,

    /**
     * Adds a remote method
     *
     * @param {String} methodName
     * @param {Object} methodConfig
     */
    _addMethod(methodName, methodConfig) {
      if (typeof methodName != "string" && !methodConfig && typeof methodName.methodName == "string") {
        methodConfig = methodName;
        methodName = methodConfig.methodName;
      } else {
        methodConfig = methodConfig || {};
        methodConfig.methodName = methodName;
      }
      this.__methodConfigs[methodName] = methodConfig || {};
      this[methodName] = (...args) => this._callMethod(methodName, args);
    },

    /**
     * Implementation of a method invocation
     *
     * @async
     * @param {String} methodName
     * @param {Array} args
     */
    _callMethod(methodName, args) {
      let methodConfig = this.__methodConfigs[methodName];
      let abortablePromise = new qx.Promise();
      let promise = this.__puppeteer.callRemoteApi({
        namespace: this.getNamespace() || this.classname,
        methodName,
        timeout: methodConfig.timeout || null,
        args
      });

      promise = promise
        .then(result => {
          if (qx.lang.Array.contains(this.__pendingCalls, abortablePromise)) {
            qx.lang.Array.remove(this.__pendingCalls, abortablePromise);
            abortablePromise.resolve(result);
          }
          return result;
        })
        .catch(err => {
          if (qx.lang.Array.contains(this.__pendingCalls, abortablePromise)) {
            qx.lang.Array.remove(this.__pendingCalls, abortablePromise);
            abortablePromise.reject(err);
          }
        });
      this.__pendingCalls.push(abortablePromise);
      return abortablePromise;
    },

    /**
     * Aborts all pending calls
     */
    abortPending() {
      let promises = this.__pendingCalls;
      this.__pendingCalls = [];
      let err = new Error("Aborting pending calls in API " + this.classname);
      err.code = "EABORT";
      promises.forEach(abortablePromise => abortablePromise.reject(err));
    },

    /**
     * Called to process an event received
     */
    async receiveEvent(eventName, data) {
      this.fireDataEvent(eventName, data);
    }
  }
});
