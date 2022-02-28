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
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */


/*
 * Simple server implementation of REST API
 *
 * The caller registers instances of an AbstractRestApiServer with the static method
 * `AbstractRestApiServer.registerApi`, and the web server uses the
 * `handleApiCallback` method to enact API calls.
 *
 * Every API call is a GET/POST/etc to `/zx/api/v1/someApiName/methodName`, where
 * `/zx/api/v1/` is a standard prefix (see `AbstractRestApiServer.[gs]etEndpoint`) and
 * `someApiName` is the name associated with an instance of `AbstractRestApiServer` by
 * calls to `AbstractRestApiServer.registerApi`.
 *
 * The `methodName` is converted to camel case and then prefixed with `_http` and the
 * HTTP method - eg a GET for a method called `allProducts` becomes `_httpGetAllProducts`.
 * This allows the REST API to have logical names like `/zx/api/v1/products/allProducts`
 * and have this translated into a method on the server called `_httpGetAllProducts`.
 *
 * Each method is called with the request and response, and is expected to be asynchronous.
 */
qx.Class.define("zx.thin.api.AbstractRestApiServer", {
  extend: qx.core.Object,

  members: {
    /**
     * Handles the API call for this API
     *
     * @param req {http.Request} the request
     * @param reply {Fastify.Reply} the response
     * @param apiName {String} the API name in the URI
     * @param methodName {String} the method name to call
     */
    async handleApiCallback(req, reply, apiName, methodName) {
      if (!methodName || methodName[0] == "_") {
        this.error(
          "Cannot interpret method name for " + apiName + "." + methodName
        );
        throw new Error(
          "Cannot interpret method name for " + apiName + "." + methodName
        );
      }

      const PREFIXES = {
        GET: "_httpGet",
        POST: "_httpPost",
        PUT: "_httpPut",
        DELETE: "_httpDelete",
        PATCH: "_httpPatch"
      };
      let prefix = PREFIXES[req.method];
      if (!prefix) {
        this.error("Unsupported method for uri " + apiName + "." + methodName);
        throw new Error(
          "Unsupported method for uri " + apiName + "." + methodName
        );
      }

      var method = this[prefix + qx.lang.String.firstUp(methodName)];
      if (typeof method !== "function") {
        this.error("Cannot find method for " + apiName + "." + methodName);
        throw new Error("Cannot find method for " + apiName + "." + methodName);
      }

      this.debug(
        `API Call ${
          req.method
        } ${apiName}.${methodName}: body: ${JSON.stringify(req.body)}`
      );
      try {
        let result = await qx.Promise.resolve(method.call(this, req, reply));
        if (result !== undefined) {
          reply.send({
            status: "ok",
            result: result
          });
          this.debug(
            `API Call ${
              req.method
            } ${apiName}.${methodName}: response: ${JSON.stringify(result)}`
          );
        } else {
          reply.send({
            status: "ok"
          });
          this.debug(
            `API Call ${req.method} ${apiName}.${methodName}: response is undefined`
          );
        }
      } catch (ex) {
        if (!qx.log.Logger.isLoggerEnabled(this, "debug")) {
          this.debug(
            `API Call ${
              req.method
            } ${apiName}.${methodName}: body: ${JSON.stringify(req.body)}`
          );
        }
        this.error(
          `Exception during API ${apiName}.${methodName}: ${ex.stack || ex}`
        );
        reply.send({
          status: "error",
          message: ex.message || "" + ex
        });
      }
    }
  },

  statics: {
    /** @type {Map} map of APISs by name */
    __apis: {},

    /** @type {String} prefix for all URIs */
    __endPoint: "/zx/api/v1/",

    /**
     * Returns the prefix for all URIS
     *
     * @return {String} the prefix
     */
    getEndpoint() {
      return zx.thin.api.AbstractRestApiServer.__endPoint;
    },

    /**
     * Changes the prefix for all APIs.  Do not change this after
     * the web server has started.
     *
     * @param endPoint {String} the new prefix
     */
    setEndpoint(endPoint) {
      zx.thin.api.AbstractRestApiServer.__endPoint = endPoint;
    },

    /**
     * Registers an API by name.
     *
     * @param name {String?} the name to register it as, defaults to the classname
     * @param api {AbstractRestApiServer} the class to register
     */
    registerApi(name, api) {
      if (api && !name) name = api.classname;
      if (!name || !api)
        throw new Error(
          `Cannot determine name or type of API class to add; name=${name} api=${api}`
        );
      zx.thin.api.AbstractRestApiServer.__apis[name] = api;
    },

    /**
     * Locates an registered API instance by name
     *
     * @param name {String} registered name of the API to lookup
     * @return {AbstractServerRestApi} instance, null if not found
     */
    getApi(name) {
      if (typeof name.classname == "string") name = name.classname;
      return zx.thin.api.AbstractRestApiServer.__apis[name] || null;
    },

    /**
     * Called by the web server to handle API calls
     *
     * @param req {http.Request} the request
     * @param reply {Fastify.Reply} the response
     */
    async handleApiCallback(req, reply) {
      let path = req.url;

      // Get the API instance
      var match = path.match(/^\/([^/]+)\/(.*)$/);
      if (!match || match.length != 3) {
        throw new Error("Cannot interpret web API uri for " + path);
      }
      var apiName = match[1];
      var methodName = match[2];

      let api = zx.thin.api.AbstractRestApiServer.getApi(apiName);
      if (!api) {
        throw new Error("Cannot find widget API for uri " + path);
      }

      return await api.handleApiCallback(req, reply, apiName, methodName);
    },

    /**
     * Fastify handler for API calls
     *
     * @param req {http.Request} the request
     * @param reply {Fastify.Reply} the response
     */
    async middleware(req, reply) {
      const ARAS = zx.thin.api.AbstractRestApiServer;
      const path = req.url;
      try {
        await ARAS.handleApiCallback(req, reply);
      } catch (ex) {
        qx.log.Logger.error(`Exception during API call to '${path}': ${ex}`);
        reply.code(500).send("" + (ex.message || ex));
      }
    }
  }
});
