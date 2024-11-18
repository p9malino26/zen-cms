qx.Class.define("zx.io.api.server.Session", {
  extend: qx.core.Object,

  construct(api, transport) {
    super();
    this.__api = api;
    this.__transport = transport;
    this.__subscriptions = {};
  },

  members: {
    __subscriptions: null,
    __messageQueue: null,

    getApi() {
      //
    },

    addSubscription(eventName) {
      let subscription = this.__subscriptions[eventName];
      if (subscription === undefined) {
        subscription = 0;
      } else {
        subscription++;
      }
      this.__subscriptions[eventName] = subscription;
    },

    removeSubscription(eventName) {
      let subscription = this.__subscriptions[eventName];
      if (subscription === undefined) {
        return;
      }
      subscription--;
      if (subscription === 0) {
        delete this.__subscriptions[eventName];
      } else {
        this.__subscriptions[eventName] = subscription;
      }
    },

    publish(eventName, data) {
      if (!this.__subscriptions[eventName]) {
        return;
      }

      let message = {
        type: "publish",
        headers: [
          "Api-Name: " + this.__api.getApiName(), //
          "Server-Api-Uuid: " + this.__api.toUuid()
        ],
        eventName: eventName,
        body: data
      };

      if (this.__transport.supportsServerPush()) {
        this.__transport.postMessage(message);
        this.setLastActivity(new Date());
      } else {
        this.__messageQueue.push(message);
      }
    }
  }
});
