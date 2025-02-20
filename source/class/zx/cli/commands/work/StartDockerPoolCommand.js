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

qx.Class.define("zx.cli.commands.work.StartDockerPoolCommand", {
  extend: zx.cli.Command,

  construct() {
    super("start-docker-pool");
    this.set({
      description: "Starts a Docker pool"
    });
    this.addArgument(
      new zx.cli.Argument("scheduler").set({
        description: "scheduler URI",
        required: true
      })
    );
    this.addArgument(
      new zx.cli.Argument("minSize").set({
        description: "minimum number of instances",
        type: "integer",
        value: 0
      })
    );
    this.addArgument(
      new zx.cli.Argument("maxSize").set({
        description: "maximum number of instances",
        type: "integer",
        value: 2
      })
    );
  },

  members: {
    async run() {
      let { args } = this.getValues();

      let m = args.scheduler.match(/^(https?):\/\/([a-z0-9.]+)(:([0-9]+))?(.*)$/);
      if (!m) {
        console.error("Please provide a valid scheduler URI");
        return 1;
      }
      let protocol = m[1];
      let host = m[2];
      let port = m[4] || (protocol === "https" ? 443 : 80);
      let path = m[5];

      if (protocol != "http") {
        console.error("Only http is supported");
        return 1;
      }

      let pool = new zx.server.work.pool.DockerWorkerPool("/zx.work", {
        minSize: args.minSize || 0,
        maxSize: args.maxSize || 2
      }).set({
        remoteServerRange: new zx.utils.Range(3000, 4000),
        nodeDebugRange: new zx.utils.Range(9000, 10_000)
      });

      let transport = new zx.io.api.transport.http.HttpClientTransport(protocol + "://" + host + ":" + port);
      let schedulerApi = new zx.server.work.api.SchedulerClientApi(transport, path);
      pool.setSchedulerApi(schedulerApi);
      await pool.startup();
    }
  }
});
