/**
 * @ignore(fetch)
 * A transport which enables browsers to use the Remote API system over HTTP
 * NOTE: Currently only supports requests to the same origin!
 */
qx.Class.define("zx.io.api.client.BrowserXhrTransport", {
  extend: zx.io.api.client.AbstractClientTransport,

  /**
   * @param {string} prefix The prefix which the paths for the requests should be prefixed with
   * For example, if we call postMessage("/foo", bar), and the prefix is '/andrew', the request will be sent to '/andrew/foo'
   */
  construct(prefix = "/zx-remote-api") {
    super();
    this.__prefix = prefix;
    this.beginPoll();
  },

  members: {
    __prefix: "",

    /**
     * Starts the polling loop
     */
    async beginPoll() {
      for (let hostname of this._getSubscribedHostnames()) {
        let sessionUuid = this.getSessionUuid(hostname);
        let message = {
          headers: {
            "Session-Uuid": sessionUuid
          },
          type: "poll",
          body: {}
        };

        await this.postMessage(hostname, message);
      }
      setTimeout(() => this.beginPoll(), this.constructor.__POLL_INTERVAL);
    },

    /**
     * @override
     */
    async postMessage(uri, data) {
      if (uri && !uri.endsWith("/")) {
        uri = uri + "/";
      }

      if (!uri) {
        uri = "/";
      }

      let res = await fetch(this.__prefix + uri, {
        method: "POST",
        body: zx.utils.Json.stringifyJson(data), //cannot be JSON.stringify because we may have dates/bignumbers!
        headers: {
          "Content-Type": "text/plain"
        }
      });

      let response = await res.json();
      this.fireDataEvent("message", response);
    }
  },

  statics: {
    /**
     * The interval in milliseconds between polls
     */
    __POLL_INTERVAL: 1000
  }
});
