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

/**
 * This command will start a Worker and listen on a port for HTTP traffic for
 * API requests; this is typically run inside a Docker container, but could also be
 * run on a local machine for testing and development
 *
 * @use(zx.demo.server.work.TestWork)
 * @use(zx.demo.server.work.ErrorWork)
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
      new zx.cli.Flag("chromium").set({
        description: "port to listen on",
        type: "string"
      })
    );
  },

  members: {
    async run() {
      let { flags } = this.getValues();

      debugger;
      let server = new zx.server.Standalone();
      await server.start();

      let worker = new zx.server.work.Worker();
      if (flags.chromium) {
        worker.setChromiumUrl(flags.chromium);
      }
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
