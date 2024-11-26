/**
 * Abstract class for server-side API
 * Implement methods here that can be called from the client
 */
qx.Class.define("zx.io.api.server.AbstractServerApi", {
  extend: qx.core.Object,
  type: "abstract",

  /**
   *
   * @param {string} apiName Name of API, which must be the same as the corresponding client-side API class
   */
  construct(apiName) {
    super();
    this.__apiName = apiName;
  },

  members: {
    /**
     * @type {string}
     */
    __apiName: null,
    /**
     *
     * @returns {string}
     */
    getApiName() {
      return this.__apiName;
    },

    /**
     * Called EXCLUSIVELY by the connection manager (zx.io.api.server.ConnectionManager) when a message is received from the client.
     * Does the appropriate action, e.g. calling a method or subscribing to a publication.
     * @param {zx.io.api.server.Request} request
     * @returns {Promise<zx.io.api.IResponseJson.IResponseData>}
     */
    async receiveMessage(request) {
      let type = request.getType();

      let responseData;
      if (type == "callMethod") {
        responseData = await this.__callMethod(request);
      } else if (type == "subscribe") {
        responseData = this.__subscribe(request);
      } else if (type == "unsubscribe") {
        responseData = this.__unsubscribe(request);
      } else {
        throw new Error(`Unknown message type: ${type}`);
      }

      return responseData;
    },

    /**
     * Calls a method on the server API
     *
     * @param {zx.io.api.server.Request} request
     * @returns {Promise<zx.io.api.IResponseJson.IResponseData>}
     */
    async __callMethod(request) {
      let result = undefined;
      let error = undefined;
      let methodArgs = request.getBody().methodArgs;

      try {
        let methodName = request.getPath().split("/").at(-1);
        result = await this[methodName].apply(this, methodArgs);
      } catch (ex) {
        error = ex;
      }

      let responseData = {
        type: "methodReturn",
        headers: {
          "Call-Index": request.getHeaders()["Call-Index"]
        },
        body: {
          methodResult: result,
          error
        }
      };
      return responseData;
    },

    /**
     * Removes a subscription from a particular event
     * @param {zx.io.api.server.Request} request
     * @returns {Promise<zx.io.api.IResponseJson.IResponseData>}
     */
    __unsubscribe(request) {
      let eventName = request.getBody().eventName;
      let session = request.createSession();
      let clientApiUuid = request.getHeader("Client-Api-Uuid");
      session.removeSubscription(this, clientApiUuid, eventName);
      let responseData = {
        headers: {
          "Session-Uuid": session.toUuid()
        },
        type: "unsubscribed",
        body: {
          eventName
        }
      };

      return responseData;
    },
    /**
     * Creates a subscription for a particular event
     * @param {zx.io.api.server.Request} request
     * @returns {Promise<zx.io.api.IResponseJson.IResponseData>}
     */
    __subscribe(request) {
      let eventName = request.getBody().eventName;
      let session = request.createSession();
      let clientApiUuid = request.getHeader("Client-Api-Uuid");
      session.addSubscription(this, clientApiUuid, eventName);
      let responseData = {
        headers: {
          "Session-Uuid": session.toUuid()
        },
        type: "subscribed",
        body: {
          eventName
        }
      };

      return responseData;
    },

    /**
     * Call this method to publish all subscribed clients of an event
     * @param {string} eventName
     * @param {any} data
     */
    publish(eventName, data) {
      zx.io.api.server.SessionManager.getInstance()
        .getAllSessions()
        .forEach(session => {
          session.publish(this, eventName, data);
        });
    }
  }
});
