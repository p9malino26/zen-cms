qx.Class.define("zx.demo.remoteapi.BrowserTransportServer", {
  extend: qx.core.Object,
  implement: zx.io.api.server.IServerTransport,

  construct(client) {
    super();
    this.__client = client;
  },

  members: {
    supportsServerPush() {
      return true;
    },

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

    sendPushResponse(response) {
      this.postMessage(response.toNativeObject());
    },

    setClient(client) {
      this.__client = client;
    },

    async receiveMessage({ uri, data }) {
      let request = new zx.io.api.server.Request(this, data);
      let response = new zx.io.api.server.Response();
      await zx.io.api.server.ConnectionManager.getInstance().receiveMessage(request, response);
      this.postMessage(response.toNativeObject());
    }
  }
});
