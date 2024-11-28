/**
 * @ignore(fetch)
 */
qx.Class.define("zx.io.api.client.BrowserXhrTransport", {
  extend: zx.io.api.client.AbstractClientTransport,

  construct() {
    super();
    this.beginPoll();
  },
  events: {
    message: "qx.event.type.Data"
  },

  members: {
    async beginPoll() {
      for (let hostname of this._getSubscribedHostnames()) {
        let sessionUuid = this.getSessionUuid(hostname);
        let message = {
          headers: {
            "Session-Uuid": sessionUuid
          },
          body: {}
        };

        await this.postMessage(hostname, message);
      }
      setTimeout(() => this.beginPoll(), this.constructor.POLL_INTERVAL);
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

      let res = await fetch("/zx-remote-api" + uri, {
        method: "POST",
        body: zx.utils.Json.stringifyJson(data),
        headers: {
          "Content-Type": "text/plain" //cannot be json because we may have dates
        }
      });

      let response = await res.json();
      this.fireDataEvent("message", response);
    }
  },

  statics: {
    POLL_INTERVAL: 1000
  }
});
