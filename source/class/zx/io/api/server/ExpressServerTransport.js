const express = require("express");
const bodyParser = require("body-parser");

qx.Class.define("zx.io.api.server.ExpressServerTransport", {
  extend: qx.core.Object,
  implement: [zx.io.api.server.IServerTransport],
  construct() {
    super();
    this.__prefix = "/zx-remote-api";
    const app = express();
    const port = 8090;
    app.use(bodyParser.text());
    app
      .use("/", express.static("compiled/source/Client"))
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
      let data = zx.utils.Json.parseJson(expressReq.body);
      let request = new zx.io.api.server.Request(this, data);
      let response = new zx.io.api.server.Response();
      let connectionManager = zx.io.api.server.ConnectionManager.getInstance();
      await connectionManager.receiveMessage(request, response);
      expressRes.send(response.toNativeObject());
    }
  }
});
