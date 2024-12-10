/**
 * A client transport is responsible for sending/receiving data to/from the server
 * using a specific connection medium e.g. HTTP, WebSockets, Bluetooth, Iframe postmessage etc.
 */
qx.Interface.define("zx.io.api.client.IClientTransport", {
  events: {
    /**
     * @type {zx.io.api.IRequestJson}
     * This event needs to be fired when a message is received from the server.
     */
    message: "qx.event.type.Data"
  },
  members: {
    /**
     * Posts a message to the server.
     *
     * @param {string} uri The URI to post the message to.
     * If the message contains is a method call, the URI should be the method name itself
     * or contain the method name at the end of the path.
     *
     * @param {zx.io.api.IRequestJson} message
     */
    postMessage(uri, message) {},

    /**
     * Gets a session UUID for a particular hostname of a client API URI
     * @param {string?} hostname
     */
    getSessionUuid(hostname) {},

    /**
     * Returns a session UUID for a particular hostname of a client API URI
     * The implementation must be able to store a session UUID for a null hostname as well
     * @param {string?} hostname
     * @param {string} sessionUuid
     */
    setSessionUuid(hostname, sessionUuid) {},

    /**
     * Must be called from the client transport when it's subscribed to an event
     * @param {string} hostname
     */
    subscribed(hostname) {},

    /**
     * Must be called from the client transport when it's unsubscribed from an event
     * @param {string} hostname
     */
    unsubscribed(hostname) {}
  }
});
