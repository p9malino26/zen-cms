const express = require("express");
/**
 * Application used for running a server for the remote API HTTP demo
 */
qx.Class.define("zx.demo.io.api.srv.ServerApp", {
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
      connectionManager.registerApi(new zx.demo.io.api.PlayerMediaServerApi(), "/player/media");
      connectionManager.registerApi(new zx.demo.io.api.PlayerMediaServerApi());
      connectionManager.registerApi(new zx.demo.io.api.WifiServerApi(), "/player/wifi");
      connectionManager.registerApi(new zx.demo.io.api.WifiServerApi());
    }
  }
});