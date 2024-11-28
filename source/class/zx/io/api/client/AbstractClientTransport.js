/**
 * Basic implementation of the IClientTransport interface.
 */
qx.Class.define("zx.io.api.client.AbstractClientTransport", {
  type: "abstract",
  extend: qx.core.Object,
  implement: [zx.io.api.client.IClientTransport],
  construct() {
    super();
    /**
     * @type {[hostname: string]: number} Maps hostnames to the number of subscriptions to that hostname
     */
    this.__subscriptions = {};

    /**
     * @type {{[hostname: string]: string}}
     */
    this.__sessionUuidForHostname = {};
  },
  events: {
    /**
     * @type {zx.io.api.IRequestJson}
     * This event needs to be fired when a message is received from the server.
     */
    message: "qx.event.type.Data"
  },
  members: {
    /**
     * @returns {string[]} The hostnames to which this client is subscribed
     */
    _getSubscribedHostnames() {
      let out = [];
      let keys = Object.keys(this.__subscriptions);
      for (let key of keys) {
        if (key == "none") {
          //TODO change to null
          out.push(null);
        } else {
          out.push(key);
        }
      }
      return out;
    },

    /**@override */
    subscribed(hostname) {
      hostname ??= "none";
      this.__subscriptions[hostname] ??= 0;
      this.__subscriptions[hostname]++;
    },

    /**@override */
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
    }
  }
});
