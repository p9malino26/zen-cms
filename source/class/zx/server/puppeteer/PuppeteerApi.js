const fs = require("fs");

qx.Class.define("zx.server.puppeteer.PuppeteerApi", {
  extend: zx.server.rest.RestApiServer,

  construct() {
    super();
  },

  members: {
    async _httpGetHello(req, res) {
      this.debug("GET gello requested");
      return { hello: "world" };
    },

    async _httpGetShutdown(req, res) {
      this.debug("Shutdown requested");
      await fs.promises.writeFile(".shutdown-docker", "shutdown");

      // Dont await this, as it will never return until this request has completed
      zx.server.puppeteer.WebServer.INSTANCE.stop();
      return {};
    }
  }
});
