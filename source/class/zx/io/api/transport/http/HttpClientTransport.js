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

  properties: {
    polling: {
      refine: true,
      init: true
    }
  },

  members: {
    /**
     * @param {string} path The URI to post the message to
     * @param {zx.io.api.IRequestJson} requestJson
     */
    async postMessage(path, requestJson) {
      let url = zx.utils.Uri.join(this.getServerUri() ?? "", path ?? "");

      try {
        let response = await fetch(url, {
          method: "POST",
          body: zx.utils.Json.stringifyJson(requestJson),
          headers: { "Content-Type": "text/plain" }
        });

        let data = await response.text().then(t => zx.utils.Json.parseJson(t));
        this.fireDataEvent("message", data);
      } catch (err) {
        //bring those into closure for debugging ease
        path;
        url;
        throw err;
      }
    }
  }
});
