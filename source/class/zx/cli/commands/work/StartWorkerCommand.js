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

/**
 * This command will start a Worker and listen on a port for HTTP traffic for
 * API requests; this is typically run inside a Docker container, but could also be
 * run on a local machine for testing and development
 */
qx.Class.define("zx.cli.commands.work.StartWorkerCommand", {
  extend: zx.cli.Command,

  construct() {
    super("start-docker-worker");
    this.set({
      description: "Starts a Docker Worker, typically for use inside a container"
    });
    this.addArgument(
      new zx.cli.Argument("port").set({
        description: "port to listen on",
        type: "integer",
        value: 10000,
        required: true
      })
    );
    this.addArgument(
      new zx.cli.Argument("chromium").set({
        description: "port to listen on",
        type: "string"
      })
    );
  },

  members: {
    async run() {
      let { args } = this.getValues();

      let server = new zx.server.Standalone();
      await server.start();

      let worker = new zx.server.work.Worker();
      if (args.chromium) {
        worker.setChromiumUrl(args.chromium);
      }
      zx.io.api.server.ConnectionManager.getInstance().registerApi(worker.getServerApi(), "/work/worker");

      let app = express();
      app.use(zx.io.api.transport.http.ExpressServerTransport.jsonMiddleware());

      new zx.io.api.transport.http.ExpressServerTransport(app, this._route);
      app.listen(args.port, () => {
        console.log(`Worker server is running on port ${args.port}`);
        console.log("zx.server.work.WORKER_READY_SIGNAL");
      });
    }
  }
});
