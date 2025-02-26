/**
 * Basic implementation of the IClientTransport interface.
 */
qx.Class.define("zx.io.api.client.AbstractClientTransport", {
  type: "abstract",
  extend: qx.core.Object,

  /**
   *
   * @param {string?} serverUri URI identifiying the server. Should include the hostname and the route to ZX remote API calls.
   * For example, if the server is running at http://localhost:3000 and its route for its HTTP server transport is /zx-api,
   * then the serverUri should be http://localhost:3000/zx-api
   */
  construct(serverUri) {
    super();

    this.__serverUri = serverUri;

    let pollTimer = new zx.utils.Timeout(null, this.__poll, this);
    this.__pollTimer = pollTimer;
    pollTimer.setRecurring(true);
    this.bind("pollInterval", pollTimer, "duration");
    this.bind("polling", pollTimer, "enabled");
  },

  destruct() {
    this.__pollTimer.dispose();
    this.__pollTimer = null;
  },

  events: {
    /**
     * @type {zx.io.api.IRequestJson}
     * This event needs to be fired when a message is received from the server.
     */
    message: "qx.event.type.Data"
  },

  properties: {
    /**
     * If enabled, this transport will poll to all subscribed hostnames
     * every set interval (property: pollInterval)
     */
    polling: {
      init: false,
      check: "Boolean",
      event: "changePolling"
    },

    pollInterval: {
      init: 1000,
      event: "changePollInterval",
      check: "Integer"
    },

    /**
     * If specified, this encryption manager will be used to encrypt messages
     * before they are sent to the server,
     * and to decrypt messages received from the server.
     *
     * Ideally, you should use this object in your implementation of postMessage
     * and in your received message event handler.
     */
    encryptionMgr: {
      init: null,
      nullable: true,
      check: "zx.io.api.crypto.IEncryptionMgr"
    }
  },

  members: {
    getServerUri() {
      return this.__serverUri;
    },
    /**
     * Timer used to poll all subscribed hostnames
     * every given interval
     *
     * @type {zx.utils.Timeout}
     */
    __pollTimer: null,

    /**
     * Number of subscriptions to the server
     */
    __subscriptions: 0,

    /**@type {string | null}*/
    __sessionUuid: null,

    /**
     * Called EXCLUSIVELY in zx.io.api.client.AbstractClientApi when the API has subscribed to an event
     * @param {string} sessionUuid
     */
    subscribe(sessionUuid) {
      this.__sessionUuid = sessionUuid;
      this.__subscriptions++;
    },

    /**
     * Called EXCLUSIVELY in zx.io.api.client.AbstractClientApi when the API has unsubscribed from an event
     * @param {string} apiPath
     */
    unsubscribe() {
      this.__subscriptions--;
      if (qx.core.Environment.get("qx.debug")) {
        if (this.__subscriptions == -1) {
          console.warn("You have unsubscribed more times than you have subscribed. There is a bug in your code.");
          debugger;
        }
      }
    },

    /**
     * Gets a session UUID for a particular hostname of a client API URI
     * @param {string?} hostname
     */
    getSessionUuid() {
      return this.__sessionUuid;
    },

    /**
     * Posts a message to the server.
     * @abstract
     * @param {string} path The path the the request. Consists of the API's path (if it has one), and the method name (if it's for a method call)
     * @param {zx.io.api.IRequestJson} requestJson
     * @returns {*}
     */
    postMessage(path, requestJson) {
      throw new Error(`Abstract method 'postMessage' of class ${this.classname} not implemented`);
    },

    /**
     * Polls the hostname for this transport,
     * if we have subscriptions.
     * @returns {Promise<void>}
     */
    async __poll() {
      if (!this.__serverUri || this.__subscriptions === 0) return;
      let requestJson = { headers: { "Session-Uuid": this.__sessionUuid }, type: "poll", body: {} };
      await this.postMessage(this.__serverUri, requestJson);
    }
  }
});
