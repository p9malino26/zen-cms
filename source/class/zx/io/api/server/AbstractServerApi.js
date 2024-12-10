const path = require("path");
/**
 * Abstract class for server-side API
 * Implement methods here that can be called from the client
 * @typedef {"GET" | "POST" | "PUT" | "DELETE"} RestMethod
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
    this.__restsByPath = {};
  },

  members: {
    /**
     * Override this field in your implementation to define the publications that this API can publish
     * @type {{[publicationName: string]: {}}}
     */
    _publications: {},

    /**
     * @type {{[methodName: string]: string[]}} A map of method names to an array of their parameter names.
     * The arguments passed into the method in the client API will be given those names (positionwise) in the method request object.
     */
    _methodParams: {},

    __path: null,

    /**
     * @type {string}
     */
    __apiName: null,

    /**
     * Called EXCLUSIVELY by zx.io.api.server.ConnectionManager.registerApi
     * Sets the path at which this API is registered
     * @param {string} path
     */
    setPath(path) {
      this.__path = path;
    },

    /**
     * @returns {string}
     */
    getApiName() {
      return this.__apiName;
    },

    /**
     * @typedef {{[restName: RestMethod]: string}} MethodsByRest Maps the HTTP rest method to the server method
     * @type {{[path: string]: MethodsByRest}}
     */
    __restsByPath: null,

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

      function pathToRegex(path) {
        path = path.replace(/\{/g, "(?<");
        path = path.replace(/\}/g, ">[^/]+)");
        return path;
      }

      //Bring query params into the method request
      let methodRequest = new zx.io.api.server.MethodRequest();
      let requestMethodPath = path.relative(this.__path ?? "/", request.getPath());
      methodRequest.setParams(request.getQuery());

      //Try to lookup the method by path
      let methodName;
      for (let [methodPath, methodByRest] of Object.entries(this.__restsByPath)) {
        let rgx = new RegExp(pathToRegex(methodPath));
        let match = requestMethodPath.match(rgx);
        if (match) {
          methodName = methodByRest[request.getRestMethod()];
          let pathArgs = match.groups;
          methodRequest.setParams(qx.lang.Object.mergeWith(request.getQuery(), pathArgs));
          break;
        }
      }

      //If no method found by path, try to use the path as the method name
      if (!methodName && requestMethodPath.indexOf("/") == -1) {
        methodName = requestMethodPath;
      }

      if (!this[methodName]) {
        throw new Error(`Method ${methodName} not found in API ${this.getApiName()}`);
      }

      //Include the arguments used in API method call if there are any
      if (request.getBody()?.methodArgs?.length) {
        this._methodParams[methodName]?.forEach((arg, i) => {
          methodRequest.getParams()[arg] = request.getBody().methodArgs[i];
        });
      }

      try {
        result = await this[methodName](methodRequest);
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
          error: error?.message
        }
      };
      return responseData;
    },

    /**
     * @param {string} methodName
     * @param {string} path
     * @param {RestMethod?} restMethod
     */
    _registerMethod(methodName, path, restMethod = "GET") {
      if (qx.core.Environment.get("qx.debug")) {
        if (path.startsWith("/")) {
          throw new Error(`Error resistering method at path ${path}. Path must be relative and must not start with a forward slash`);
        }

        if (!this[methodName]) {
          throw new Error(`Error resistering method: method ${methodName} not found in API ${this.getApiName()}`);
        }
      }

      this.__restsByPath[path] ??= {};
      this.__restsByPath[path][restMethod] = methodName;
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
      if (this._publications[eventName] === undefined) {
        this.warn(`Server API ${this.toString()} attempts to publish "${eventName}" but it is not defined in the _publications field.`);
        debugger;
      }
      zx.io.api.server.SessionManager.getInstance()
        .getAllSessions()
        .forEach(session => {
          session.publish(this, eventName, data);
        });
    }
  }
});
