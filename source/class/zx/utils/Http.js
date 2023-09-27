const http = require("http");

qx.Class.define("zx.utils.Http", {
  extend: qx.core.Object,

  statics: {
    HttpError: null,

    /**
     * Does an HTTP request and returns the body; if the content type is application/json then
     * it will parse it as JSON first
     *
     * @param {String} url
     * @returns {*?}
     */
    async httpGet(url) {
      return new Promise((resolve, reject) => {
        let req = http.request(
          url,
          {
            method: "GET"
          },
          response => {
            response.setEncoding("utf8");
            const hasResponseFailed = response.status >= 400;
            let responseBody = "";
            let contentType = response.headers["content-type"];
            if (hasResponseFailed) {
              reject(`Request to ${response.url} failed with HTTP ${response.status}`);
            }

            response.on("data", chunk => (responseBody += chunk.toString()));
            response.on("end", () => {
              if (contentType.match(/^application\/json/)) {
                responseBody = JSON.parse(responseBody);
              }
              resolve(responseBody);
            });
          }
        );
        req.on("error", reject);
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
