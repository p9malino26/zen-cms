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
 *    John Spackman (john.spackman@zenesis.com, @johnspackman)
 *
 * ************************************************************************ */

const express = require("express");
const fs = require("fs");

/**
 * This command will start a Worker and listen on a port for HTTP traffic for
 * API requests; this is typically run inside a Docker container, but could also be
 * run on a local machine for testing and development
 *
 * @use(zx.demo.server.work.TestWork)
 * @use(zx.demo.server.work.ErrorWork)
 * @use(zx.demo.server.work.TestChromiumWork)
 */
qx.Class.define("zx.cli.commands.work.StartWorkerCommand", {
  extend: zx.cli.Command,

  construct() {
    super("start-worker");
    this.set({
      description: "Starts a Node Worker"
    });
    this.addFlag(
      new zx.cli.Flag("port").set({
        description: "port to listen on",
        type: "integer",
        value: 10000,
        required: true
      })
    );
    this.addFlag(
      new zx.cli.Flag("launch-chromium").set({
        description: "whether to launch chromium (because we are running in the container)",
        type: "boolean",
        value: false,
        required: true
      })
    );
  },

  members: {
    async run() {
      let { flags } = this.getValues();

      debugger;
      let server = new zx.server.Standalone();
      await server.start();

      if (flags.launchChromium) {
        const playwright = require("playwright-core");
        const puppeteer = require("puppeteer-core");

        let executablePath = playwright.chromium.executablePath();
        if (!fs.existsSync(executablePath)) {
          throw new Error(`Chromium executable not found at ${executablePath}`);
        }
        let options = {
          headless: true,
          devtools: true,
          executablePath,
          args: [`--remote-debugging-port=11000`, "--remote-debugging-address=0.0.0.0", `--no-sandbox`]
        };

        this.__browser = await puppeteer.launch(options);
        console.log(`Chrome launched on port 11000`);

        let response = await zx.utils.Http.httpGet(`http://127.0.0.1:11000/json/version`);
        let data = response.body;
        console.log("Chromium ready", JSON.stringify({ version: data["Browser"], userAgent: data["User-Agent"] }, null, 2));
      }

      let worker = new zx.server.work.Worker();
      zx.io.api.server.ConnectionManager.getInstance().registerApi(worker.getServerApi(), "/work/worker");

      let app = express();
      app.use(zx.io.api.transport.http.ExpressServerTransport.jsonMiddleware());

      new zx.io.api.transport.http.ExpressServerTransport(app);
      let httpServer = app.listen(flags.port, () => {
        this.info(`Worker server is running on port ${flags.port}`);
        this.info("zx.server.work.WORKER_READY_SIGNAL");
      });

      worker.addListener("shutdown", () => {
        this.info("Shutting down expressjs");
        worker.dispose();
        httpServer.close();
        server.stop();
      });
    }
  }
});
