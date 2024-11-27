/**
 * Interface for server transports,
 * which send and receive data from the client,
 * via the specific medium e.g. HTTP, WebSockets, Iframe postmessage, etc.
 */
qx.Interface.define("zx.io.api.server.IServerTransport", {
  members: {
    /**
     * Sends a message back to the client.
     * Only works if this transport support server-side push
     * @param {zx.io.api.IRequestJson} message
     */
    postMessage(message) {},

    /**
     * @type {boolean}
     * Override this method to return true if the transport supports server-side push.
     */
    supportsServerPush() {},

    /**
     * Creates a response object for a server push message.
     * Only works if this transport supports server-side push
     * @returns {zx.io.api.server.Response}
     */
    createPushResponse() {},

    /**
     * Sends the server push response created with method `createPushResponse`
     * @param {zx.io.api.server.Response} response
     */
    sendPushResponse(response) {}
  }
});
