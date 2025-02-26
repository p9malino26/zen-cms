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
qx.Class.define("zx.cli.commands.demo.work.LocalWorkerPoolCommand", {
  extend: zx.cli.Command,

  construct() {
    super("local-worker-pool", "Demos using a LocalWorkerPool with a scheduler");
  },

  members: {
    async run() {
      let server = new zx.server.Standalone();
      await server.start();

      let pool = new zx.server.work.pools.LocalWorkerPool().set({
        poolConfig: { minSize: 5 }
      });

      let scheduler = new zx.server.work.scheduler.QueueScheduler();
      zx.io.api.server.ConnectionManager.getInstance().registerApi(scheduler.getServerApi(), "/scheduler");

      let schedulerClientApi = zx.io.api.ApiUtils.createClientApi(zx.server.work.scheduler.ISchedulerApi, zx.io.api.ApiUtils.getClientTransport(), "/scheduler");
      pool.setSchedulerApi(schedulerClientApi);

      scheduler.addListener("complete", e => {
        console.log("scheduler: complete: ", e.getData());
      });

      await pool.startup();

      scheduler.pushWork({
        uuid: qx.util.Uuid.createUuidV4(),
        classname: zx.demo.server.work.TestWork.classname,
        compatibility: [],
        args: []
      });

      setTimeout(() => {
        scheduler.pushWork({
          uuid: qx.util.Uuid.createUuidV4(),
          classname: zx.demo.server.work.ErrorWork.classname,
          compatibility: [],
          args: []
        });
        scheduler.addListener("workCompleted", async e => {
          if (scheduler.getRunningSize() == 0) {
            console.log("All work completed");
            await pool.shutdown();
            await server.stop();
          }
        });
      }, 2000);
    }
  }
});
