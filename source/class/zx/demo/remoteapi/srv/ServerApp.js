const express = require("express");
qx.Class.define("zx.demo.remoteapi.srv.ServerApp", {
  extend: qx.application.Basic,
  members: {
    async main() {
      debugger; //now is a good time to break on caught exceptions
      let app = express();
      let port = 8090;
      app.use(zx.io.api.transport.http.ExpressServerTransport.jsonMiddleware());
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
      let transport = new zx.io.api.transport.http.ExpressServerTransport(app);
      let connectionManager = zx.io.api.server.ConnectionManager.getInstance();
      connectionManager.registerApi(new zx.demo.remoteapi.PlayerMediaServerApi(), "/player/media");
      connectionManager.registerApi(new zx.demo.remoteapi.PlayerMediaServerApi());
      connectionManager.registerApi(new zx.demo.remoteapi.WifiServerApi(), "/player/wifi");
      connectionManager.registerApi(new zx.demo.remoteapi.WifiServerApi());
    }
  }
});
