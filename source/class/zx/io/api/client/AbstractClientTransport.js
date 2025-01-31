/**
 * Basic implementation of the IClientTransport interface.
 */
qx.Class.define("zx.io.api.client.AbstractClientTransport", {
  type: "abstract",
  extend: qx.core.Object,

  construct() {
    super();

    this.__subscriptions = {};
    this.__sessionUuidForHostname = {};

    let pollTimer = new zx.utils.Timeout(null, this._pollAll, this);
    this.__pollTimer = pollTimer;
    pollTimer.setRecurring(true);
    this.bind("pollInterval", pollTimer, "duration");
    this.bind("polling", pollTimer, "enabled");
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
    /**
     * Timer used to poll all subscribed hostnames
     * every given interval
     *
     * @type {zx.utils.Timeout}
     */
    __pollTimer: null,

    /**@type {{ [hostname: string]: number }} Maps hostnames to the number of subscriptions to that hostname */
    __subscriptions: null,

    /**@type {{ [hostname: string]: string }}*/
    __sessionUuidForHostname: null,

    /**
     * @returns {string[]} The hostnames to which this client is subscribed
     */
    _getSubscribedHostnames() {
      let out = [];
      let keys = Object.keys(this.__subscriptions);
      for (let key of keys) {
        if (key == "none") {
          out.push(null);
        } else {
          out.push(key);
        }
      }
      return out;
    },

    /**
     * Called EXCLUSIVELY in zx.io.api.client.AbstractClientApi when the API has subscribed to an event
     * @param {string} apiPath
     */
    subscribed(hostname) {
      hostname ??= "none";
      this.__subscriptions[hostname] ??= 0;
      this.__subscriptions[hostname]++;
    },

    /**
     * Called EXCLUSIVELY in zx.io.api.client.AbstractClientApi when the API has unsubscribed from an event
     * @param {string} apiPath
     */
    unsubscribed(hostname) {
      hostname ??= "none";
      this.__subscriptions[hostname]--;
      if (this.__subscriptions[hostname] === 0) {
        delete this.__subscriptions[hostname];
      }
    },

    /**
     * Gets a session UUID for a particular hostname of a client API URI
     * @param {string?} hostname
     */
    getSessionUuid(hostname) {
      hostname ??= "none";
      return this.__sessionUuidForHostname[hostname];
    },

    /**
     * Returns a session UUID for a particular hostname of a client API URI
     * The implementation must be able to store a session UUID for a null hostname as well
     * @param {string?} hostname
     * @param {string} sessionUuid
     */
    setSessionUuid(hostname, sessionUuid) {
      hostname ??= "none";
      let existingUuid = this.__sessionUuidForHostname[hostname];
      if (existingUuid && existingUuid != sessionUuid) {
        this.warn(`Session UUID for hostname ${hostname} is being overwritten`);
      }
      this.__sessionUuidForHostname[hostname] = sessionUuid;
    },

    /**
     * Posts a message to the server.
     * @abstract
     * @param {string} uri The URI to post the message to
     * @param {zx.io.api.IRequestJson} requestJson
     * @returns {*}
     */
    postMessage(uri, requestJson) {
      throw new Error(`Abstract method 'postMessage' of class ${this.classname} not implemented`);
    },

    /**
     * Polls all hostnames to which the client is subscribed
     * @returns {Promise<void>}
     */
    async _pollAll() {
      for (let hostname of this._getSubscribedHostnames()) {
        let sessionUuid = this.getSessionUuid(hostname);
        if (!sessionUuid) {
          return;
        }
        let requestJson = { headers: { "Session-Uuid": sessionUuid }, type: "poll", body: {} };
        await this.postMessage(hostname, requestJson);
      }
    }
  }
});
