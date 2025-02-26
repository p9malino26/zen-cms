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
 * The server part of a loopback transport
 *
 * A loopback transport does not communicate across a process boundary, instead it communicates within the same process
 * on the same thread. This is primarily useful for testing and debugging.
 */
qx.Class.define("zx.io.api.transport.loopback.LoopbackServerTransport", {
  extend: zx.io.api.server.AbstractServerTransport,

  construct() {
    super();
    this.__clientsByApiUuid = new Map();
  },

  members: {
    /**@type {Map<string, zx.io.api.transport.loopback.LoopbackClientTransport>}*/
    __clientsByApiUuid: null,

    /**
     * Connects to a client
     * @param {any} id
     * @param {zx.io.api.transport.loopback.LoopbackClientTransport} client
     */
    connect(client) {
      if (this.__clientsByApiUuid.has(client.toUuid()) && this.__clientsByApiUuid.get(client.toUuid()) !== client) {
        throw new Error("Different client already exists with the same UUID");
      }
      client.addListener("post", evt => {
        let { path, requestJson } = evt.getData();
        this.__clientsByApiUuid.set(requestJson.headers["Client-Api-Uuid"], client);
        this.receiveMessage(path, requestJson);
      });
    },

    /**
     * Sends a message back to the client
     * @param {zx.io.api.IRequestJson} requestJson
     */
    __postMessage(requestJson) {
      this.__clientsByApiUuid.get(requestJson.data[0].headers["Client-Api-Uuid"]).receiveMessage(requestJson);
    },

    /**
     *
     * Called EXCLUSIVELY by zx.io.api.transport.loopback.LoopbackServerTransport
     * when it posts a message to this transport
     *
     * @param {string} path
     * @param {zx.io.api.IRequestJson} requestJson
     */
    async receiveMessage(path, requestJson) {
      let request = new zx.io.api.server.Request(this, requestJson);
      if (path) {
        request.setPath(path);
      }
      let response = new zx.io.api.server.Response();
      await zx.io.api.server.ConnectionManager.getInstance().receiveMessage(request, response);
      this.__postMessage(response.toNativeObject());
    },

    /**
     * @returns {false}
     */
    supportsServerPush() {
      return true;
    },

    /**
     * @override
     */
    sendPushResponse(response) {
      let data = response.toNativeObject();
      this.__postMessage(data);
    }
  },

  destruct() {
    delete this.__clientsByApiUuid;
  }
});
