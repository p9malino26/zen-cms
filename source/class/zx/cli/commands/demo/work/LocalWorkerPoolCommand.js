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

const fs = require("fs");

/**
 * This command will start a Worker and listen on a port for HTTP traffic for
 * API requests; this is typically run inside a Docker container, but could also be
 * run on a local machine for testing and development
 */
qx.Class.define("zx.cli.commands.demo.work.LocalWorkerPoolCommand", {
  extend: zx.cli.Command,

  construct() {
    super("local-worker-pool", "Demos using a LocalWorkerPool with a scheduler");
    this.addFlag(
      new zx.cli.Flag("worker-location").set({
        description: "where to run the workers",
        type: "enum",
        enumValues: ["local", "node"],
        required: true
      })
    );
    this.addFlag(
      new zx.cli.Flag("pool-min-size").set({
        description: "Minimum size of the worker pool",
        type: "integer",
        value: 5,
        required: true
      })
    );
    this.addFlag(
      new zx.cli.Flag("pool-max-size").set({
        description: "Maximum size of the worker pool",
        type: "integer",
        value: 10,
        required: true
      })
    );
    this.addFlag(
      new zx.cli.Flag("clean").set({
        description: "Whether to clean the work directory",
        type: "boolean",
        value: false,
        required: true
      })
    );
    this.addFlag(
      new zx.cli.Flag("inspect").set({
        description: "whether to run the node worker process under the debugger",
        type: "enum",
        enumValues: ["none", "inspect", "inspect-brk"],
        value: "none",
        required: true
      })
    );
  },

  members: {
    async run() {
      let { flags } = this.getValues();

      let server = new zx.server.Standalone();
      await server.start();

      let pool;
      let poolConfig = {
        minSize: flags.poolMinSize,
        maxSize: flags.poolMaxSize
      };

      if (flags.workerLocation == "local") {
        pool = new zx.server.work.pools.LocalWorkerPool().set({
          poolConfig
        });
      } else {
        pool = new zx.server.work.pools.NodeProcessWorkerPool().set({
          poolConfig,
          nodeInspect: flags.inspect
        });
      }

      let scheduler = new zx.server.work.scheduler.QueueScheduler("temp/scheduler/");

      if (flags.clean) {
        await fs.promises.rm(pool.getWorkDir(), { force: true, recursive: true });
        await fs.promises.rm(scheduler.getWorkDir(), { force: true, recursive: true });
      }

      zx.io.api.server.ConnectionManager.getInstance().registerApi(scheduler.getServerApi(), "/scheduler");

      let schedulerClientApi = zx.io.api.ApiUtils.createClientApi(zx.server.work.scheduler.ISchedulerApi, zx.io.api.ApiUtils.getClientTransport(), "/scheduler");
      pool.setSchedulerApi(schedulerClientApi);

      scheduler.addListener("complete", e => {
        console.log("scheduler: complete: ", e.getData());
      });

      await pool.startup();
      await scheduler.startup();

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
            await schedulerClientApi.terminate();
          }
        });
      }, 2000);
    }
  }
});
