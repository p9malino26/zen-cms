/* ************************************************************************
 *
 *  Zen [and the art of] CMS
 *
 *  https://zenesis.com
 *
 *  Copyright:
 *    2019-2022 Zenesis Ltd, https://www.zenesis.com
 *
 *  License:
 *    MIT (see LICENSE in project root)
 *
 *  Authors:
 *    Patryk Milinowski (@p9malino26)
 *    Will Johnson (@willsterjohnson)
 *
 * ************************************************************************ */

/**
 * The client part of a loopback transport
 *
 * A loopback transport does not communicate across a process boundary, instead it communicates within the same process
 * on the same thread. This is primarily useful for testing and debugging.
 */
qx.Class.define("zx.io.api.transport.loopback.LoopbackClientTransport", {
  extend: zx.io.api.client.AbstractClientTransport,

  events: {
    /**
     * @type {{path: string, requestJson: zx.io.api.IRequestJson}} This event is fired in order to send data
     * to the loopback server transport
     */
    post: "qx.event.type.Data"
  },

  members: {
    /**@type {zx.io.api.transport.loopback.LoopbackServerTransport}*/
    __server: null,

    /**
     * Connects to a server
     * @param {zx.io.api.transport.loopback.LoopbackServerTransport} server
     */
    connect(server) {
      if (this.__server) {
        throw new Error("Already connected to server");
      }
      this.__server = server;
    },

    /**
     * @override
     */
    postMessage(path, requestJson) {
      if (!this.__server) {
        throw new Error("Not connected to server");
      }
      this.fireDataEvent("post", { path, requestJson });
    },

    /**
     * Called EXCLUSIVELY by zx.io.api.transport.loopback.LoopbackServerTransport
     * when it posts a message to this transport
     * @param {zx.io.api.IResponseJson} data
     */
    async receiveMessage(data) {
      this.fireDataEvent("message", data);
    }
  },

  destruct() {
    delete this.__server;
  }
});
