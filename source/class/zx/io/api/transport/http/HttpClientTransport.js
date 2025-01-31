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
 *    Will Johnson (@willsterjohnson)
 *
 * ************************************************************************ */

/**
 * @ignore(fetch)
 */
const path = require("path");
qx.Class.define("zx.io.api.transport.http.HttpClientTransport", {
  extend: zx.io.api.client.AbstractClientTransport,

  /**
   *
   * @param {string} route  The prefix which the paths for the requests should be prefixed with
   * For example, if we call postMessage("/foo", bar), and the route is '/andrew', the request will be sent to '/andrew/foo'
   */
  construct(route = "/zx-api/") {
    super();
    this.__route = route;
  },

  properties: {
    polling: {
      refine: true,
      init: true
    }
  },

  members: {
    /**
     * @param {string} uri The URI to post the message to
     * @param {zx.io.api.IRequestJson} requestJson
     */
    async postMessage(uri, requestJson) {
      // ensure trailing slash, default to '/'
      if (!uri) {
        uri = "/";
      }

      let { hostname } = zx.utils.Uri.breakoutUri(uri);
      if (hostname) {
        throw new Error("Custom hostnames are not currently supported in HTTP client transports!");
      }

      uri = path.join(this.__route, uri);

      if (!uri.startsWith("/") && !uri.match(/^[a-z]+:\/\//i)) {
        uri = `/${uri}`;
      }

      try {
        let response = await fetch(uri, {
          method: "POST",
          body: zx.utils.Json.stringifyJson(requestJson),
          headers: { "Content-Type": "text/plain" }
        });

        let data = await response.text().then(t => zx.utils.Json.parseJson(t));
        this.fireDataEvent("message", data);
      } catch (err) {
        if (qx.core.Environment.get("qx.debug")) {
          console.error(`Failed to post message to ${uri}`, err);
        }
      }
    }
  }
});
