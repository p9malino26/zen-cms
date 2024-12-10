/**
 * Demo server transport to be used in a basic JavaScript environment,
 * such as a browser or Node.js.
 */
qx.Class.define("zx.demo.remoteapi.BrowserTransportServer", {
  extend: qx.core.Object,
  implement: zx.io.api.server.IServerTransport,

  construct(client) {
    super();
    this.__client = client;
  },

  members: {
    /**
     * @override
     */
    supportsServerPush() {
      return true;
    },

    /**
     * @override
     */
    postMessage(data) {
      if (this.__client) {
        setTimeout(() => this.__client.receiveMessage(data), 1);
      }
    },

    /**
     * @override
     */
    createPushResponse(session) {
      return new zx.io.api.server.Response();
    },

    /**
     * @override
     */
    sendPushResponse(response) {
      this.postMessage(response.toNativeObject());
    },

    /**
     *
     * @param {zx.demo.remoteapi.BrowserTransportClient} client
     */
    setClient(client) {
      this.__client = client;
    },

    /**
     *
     * @param {*} param0
     */
    async receiveMessage({ uri, data }) {
      let request = new zx.io.api.server.Request(this, data);
      let response = new zx.io.api.server.Response();
      await zx.io.api.server.ConnectionManager.getInstance().receiveMessage(request, response);
      this.postMessage(response.toNativeObject());
    }
  }
});
