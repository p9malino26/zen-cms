const http = require("http");

/**
 * Helper method for HTTP requests
 *
 * @typedef HttpResult
 * @property {Integer} statusCode
 * @property {String} statusMessage
 * @property {String} body
 * @property {Object<String,String>} headers
 */
qx.Class.define("zx.utils.Http", {
  extend: qx.core.Object,

  statics: {
    HttpError: null,

    /**
     * Does an HTTP GET and returns the body; if the content type is application/json then
     * it will parse it as JSON first
     *
     * @param {String} url
     * @param {Object<String,String>?} headers
     * @returns {HttpResult?}
     */
    async httpGet(url, headers) {
      return await this.__simpleRequest("GET", url, headers);
    },

    /**
     * Does an HTTP POST and returns the body; if the content type is application/json then
     * it will parse it as JSON first
     *
     * @param {String} url
     * @param {Object<String,String>?} headers
     * @param {String} body
     * @returns {HttpResult?}
     */
    async httpPost(url, headers, body) {
      return await this.__simpleRequest("POST", url, headers, body);
    },

    /**
     * Does an HTTP request and returns the body; if the content type is application/json then
     * it will parse it as JSON first
     *
     * @param {String} method
     * @param {String} url
     * @param {Object<String,String>?} headers
     * @paran {String} body
     * @returns {HttpResult?}
     */
    async __simpleRequest(method, url, headers, body) {
      return new Promise((resolve, reject) => {
        let options = {
          method,
          headers: headers || {}
        };

        if (body) {
          if (typeof body != "string") {
            body = JSON.stringify(body, null, 2);
            if (!options.headers["Content-Type"]) {
              options.headers["Content-Type"] = "application/json";
            }
          }
        }

        const callback = response => {
          response.setEncoding("utf8");
          let httpResult = {
            statusCode: response.statusCode,
            statusMessage: response.statusMessage,
            headers: response.headers,
            body: null
          };

          const hasResponseFailed = response.statusCode >= 400;
          let responseBody = "";
          let contentType = response.headers["content-type"];
          if (hasResponseFailed) {
            reject(`Request to ${response.url} failed with HTTP ${response.statusCode}`);
          }

          response.on("data", chunk => (responseBody += chunk.toString()));
          response.on("end", () => {
            if (contentType && contentType.match(/^application\/json/)) {
              responseBody = JSON.parse(responseBody);
            }
            httpResult.body = responseBody;
            resolve(httpResult);
          });
        };

        let req = http.request(url, options, callback);
        req.on("error", reject);
        if (body) {
          req.write(body);
        }
        req.end();
      });
    }
  },

  defer(statics) {
    class HttpError extends Error {
      constructor(statusCode, message) {
        super(message);
        if (typeof statusCode == "string") {
          let tmp = parseInt(statusCode, 10);
          if (isNaN(tmp)) {
            message = statusCode;
            statusCode = 500;
          } else {
            statusCode = tmp;
          }
        }
        this.statusCode = statusCode || 500;
      }
    }

    statics.HttpError = HttpError;
  }
});
