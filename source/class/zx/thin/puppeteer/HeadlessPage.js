/**
 * This class is instantiated on the client side and is responsible for interacting with the
 * instance of zx.server.puppeteer.PuppeteerClient, including calling API methods and sending
 * events which are exposed via zx.server.puppeteer.AbstractRemoteApi
 */
qx.Class.define("zx.thin.puppeteer.HeadlessPage", {
  extend: qx.core.Object,

  /**
   * Constructor
   * @param {Object<String,Function>} delegate method to expose @see `delegate` property
   */
  construct(delegate) {
    super();
    this.__pendingCalls = {};
    window.addEventListener("message", this._onMessage.bind(this), false);
    if (delegate) {
      this.setDelegate(delegate);
    }
  },

  properties: {
    /** @type{Object<String,Function>} map of methods which can be called from the zx.server.puppeteer.PuppeteerClient */
    delegate: {
      init: null,
      nullable: true
    }
  },

  events: {
    message: "qx.event.type.Data",
    ready: "qx.event.type.Event"
  },

  members: {
    /** @type{Boolean} whether the other side is ready */
    __parentReady: false,

    /** @type{Array} events to post back to the other side */
    __queuedEvents: null,

    /** @type{Object<Integer,Promise>} calls which are sent to the other side and the promises that will resolve when they return */
    __pendingCalls: null,

    /** @type{Integer} unique serial number for each call, so that the other side can tell us which pending call is being returned from */
    __pendingCallsSerialNo: 0,

    /**
     * Detects whether the headless chrome is connected and ready to communicate (and
     * also whether the "ready" event has been `emit`-d from this
     *
     * @return {Boolean} true if ready
     */
    isReady() {
      return this.__parentReady;
    },

    /**
     * Posts a shutdown message to the node controller
     */
    postShutdown() {
      this.postMessage("shutdown");
    },

    /**
     * Tells the other side that we are ready
     */
    postReady() {
      // Send "loaded" event immediately; this will alert the outer iframe that any previously
      //  sent messages (such as parent-ready) will not have been received
      this._postResponse({
        type: "event",
        event: {
          type: "loaded",
          data: null
        }
      });

      // Send the "ready" event (which will only be dispatched once the parent is ready for it)
      this.postMessage("ready");
    },

    /**
     * Posts an event back to the parent iframe
     */
    postMessage(type, data) {
      if (!this.__parentReady) {
        if (!this.__queuedEvents) {
          this.__queuedEvents = [];
        }
        this.__queuedEvents.push({
          type: type,
          data: data
        });

        return;
      }
      //console.log("Posting message: type=" + type);
      this._postResponse({
        type: "event",
        event: {
          type: type,
          data: data
        }
      });
    },

    /**
     * Sends the message to the other side
     *
     * @param {*} data
     */
    _postResponse(data) {
      // If the event source is this window, then we're being controlled from DevTools and the
      //  postMessage call is injected.  Our way back to DevTools is by embedding in console
      //  output and not via postMesssage (because that will cause an infinite loop)
      if (window === window.parent) {
        ///if (this.__lastSource === window) {
        console.log(zx.thin.puppeteer.HeadlessPage.PREFIX + JSON.stringify(data) + zx.thin.puppeteer.HeadlessPage.SUFFIX);
      } else {
        if (this.__lastSource && this.__lastSource !== window.parent) {
          throw new Error("Multiple sources for messages!");
        }
        window.parent.postMessage(JSON.stringify(data), "*");
      }
    },

    /**
     * Implementation of API calls to the other side
     *
     * @param {String} namespace
     * @param {String} methodName
     * @param {Object[]} args
     * @returns {*}
     */
    apiCall(namespace, methodName, args) {
      let id = "apicall-" + ++this.__pendingCallsSerialNo;
      let data = (this.__pendingCalls[id] = {
        id: id,
        namespace: namespace,
        methodName: methodName,
        args: args
      });

      let p = new Promise((resolve, reject) => {
        data.promise = this;
        data.resolve = resolve;
        data.reject = reject;
      });
      this.postMessage("api-call", {
        id: id,
        namespace: namespace,
        methodName: methodName,
        args: args
      });

      return p;
    },

    /**
     * Sends an event to the other side
     * @param {String} namespace
     * @param {String} eventName
     * @param {*} msgData
     */
    apiSendEvent(namespace, eventName, msgData) {
      this.postMessage("api-event", {
        namespace: namespace,
        name: eventName,
        data: msgData
      });
    },

    /**
     * Called when we receive a message posted back to us
     *
     * @param {*} evt
     * @returns
     */
    async _onMessage(evt) {
      var t = this;

      // Security
      /*
      if (evt.origin !== "null" && evt.origin !== document.location.origin)
        throw new Error("Access denied because wrong origin, found " + evt.origin + ", expected " + document.location.origin);
      */
      this.__lastSource = evt.source;

      function apiError(err) {
        t.error(err);
        t._postResponse({
          type: "api-error",
          error: err
        });
      }

      // Get data
      var msg = evt.data;

      //console.log("Received message: " + msg);
      this.fireDataEvent("message", msg);
      var json;
      try {
        json = JSON.parse(msg);
      } catch (ex) {
        apiError("Cannot parse message " + msg);
        return;
      }
      if (!json) {
        apiError("No JSON in message " + msg);
        return;
      }

      // Method call
      if (json.type == "call") {
        var data = json && json.data;
        if (!data) {
          apiError("No data in message " + msg);
          return;
        }
        var delegate = this.getDelegate();
        if (delegate) {
          var fn = delegate[data.methodName];
          if (fn) {
            var result = fn.apply(delegate, data.args || []);
            qx.Promise.resolve(result).then(result => {
              t._postResponse({
                type: "return",
                serialNo: json.serialNo,
                value: result
              });
            });
            return;
          }
        }

        apiError("Cannot process method call for '" + data.methodName + "' because there is no such delegate");
      } else if (json.type == "parent-ready") {
        this.__parentReady = true;
        if (this.__queuedEvents) {
          var queued = this.__queuedEvents;
          this.__queuedEvents = null;
          queued.forEach(function (event) {
            t._postResponse({
              type: "event",
              event: event
            });
          });
        }
        this.fireEvent("ready");
      } else if (json.type == "api-return") {
        var data = this.__pendingCalls[json.id];
        if (!data) {
          apiError("Unexpected API return: " + JSON.stringify(json));
          return;
        }
        delete this.__pendingCalls[json.id];
        if (json.exception) data.reject(json.exception);
        else data.resolve(json.result);
      } else if (evt.source !== window) {
        // Error
        apiError("Unexpected message type: " + JSON.stringify(json));
      }
    }
  },

  statics: {
    PREFIX: "[[__ZX_PUPPETEER_START__]]",
    SUFFIX: "[[__ZX_PUPPETEER_END__]]"
  }
});
