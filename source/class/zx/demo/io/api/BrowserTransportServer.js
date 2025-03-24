/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2025 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */

/**
 * Demo server transport to be used in a basic JavaScript environment,
 * such as a browser or Node.js.
 */
qx.Class.define("zx.demo.io.api.BrowserTransportServer", {
  extend: zx.io.api.server.AbstractServerTransport,

  /**
   *
   * @param {zx.demo.io.api.BrowserTransportClient} client
   */
  construct(client) {
    super();
    this.__client = client;
  },

  members: {
    __client: null,
    /**
     * @override
     */
    supportsServerPush() {
      return true;
    },

    /**
     *
     * @param {zx.io.api.IResponseJson} data
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
     * @param {zx.demo.io.api.BrowserTransportClient} client
     */
    setClient(client) {
      this.__client = client;
    },

    /**
     * Called by the client directly to receive a message.
     */
    /**
     *
     * @param {{data: zx.io.api.IRequestJson}} param0
     */
    async receiveMessage({ data }) {
      let request = new zx.io.api.server.Request(this, data);
      let response = new zx.io.api.server.Response();
      await zx.io.api.server.ConnectionManager.getInstance().receiveMessage(request, response);
      this.postMessage(response.toNativeObject());
    }
  }
});
