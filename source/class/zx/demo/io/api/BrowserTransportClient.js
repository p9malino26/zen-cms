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
 *    Patryk Malinowski (@p9malino26)
 *
 * ************************************************************************ */

qx.Class.define("zx.demo.io.api.BrowserTransportClient", {
  extend: zx.io.api.client.AbstractClientTransport,

  construct(server) {
    super();
    this.__server = server;
  },

  events: {
    /**@override */
    message: "qx.event.type.Data"
  },

  members: {
    /**@override */
    postMessage(uri, data) {
      if (this.__server) {
        setTimeout(() => this.__server.receiveMessage({ uri, data }), 1);
      }
    },

    setServer(server) {
      this.__server = server;
    },

    async receiveMessage(data) {
      this.fireDataEvent("message", data);
    }
  }
});
