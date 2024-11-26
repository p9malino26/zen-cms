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
    }
  }
});
