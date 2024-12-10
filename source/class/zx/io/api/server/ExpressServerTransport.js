const express = require("express");
const bodyParser = require("body-parser");

qx.Class.define("zx.io.api.server.ExpressServerTransport", {
  extend: qx.core.Object,
  implement: [zx.io.api.server.IServerTransport],

  /**
   * @param {string} prefix The prefix which the paths for the requests should be prefixed with
   * For example, if we call postMessage("/foo", bar), and the prefix is '/andrew', the request will be sent to '/andrew/foo'
   */
  construct(prefix = "/zx-remote-api") {
    super();
    this.__prefix = prefix;
    const app = express();
    const port = 8090;
    app.use(bodyParser.text());
    app
      .use("/", express.static("compiled/source/remoteApiBrowserTest"))
      .use("/transpiled", express.static("compiled/source/transpiled"))
      .use("/resource", express.static("compiled/source/resource"))
      .use(this.__prefix + "/**", (req, res) => {
        this.__onMessageReceived(req, res);
      })
      .listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
  },
  members: {
    postMessage() {},
    createPushResponse() {},
    sendPushResponse() {},

    /**@override */
    supportsServerPush() {
      return false;
    },

    async __onMessageReceived(expressReq, expressRes) {
      let data;
      if (typeof expressReq.body == "object") {
        data = expressReq.body;
      } else {
        data = zx.utils.Json.parseJson(expressReq.body);
      }

      if (Object.keys(data).length === 0) {
        data = null;
      }

      let request = new zx.io.api.server.Request(this, data);
      request.setPath(expressReq.baseUrl.substring(this.__prefix.length));
      request.setRestMethod(expressReq.method);
      request.setQuery(expressReq.query);

      let response = new zx.io.api.server.Response();
      let connectionManager = zx.io.api.server.ConnectionManager.getInstance();
      await connectionManager.receiveMessage(request, response);
      expressRes.send(response.toNativeObject());
    }
  }
});
