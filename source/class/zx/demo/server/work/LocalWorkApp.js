qx.Class.define("zx.demo.server.work.LocalWorkApp", {
  extend: qx.application.Basic,

  members: {
    async main() {
      qx.log.Logger.register(zx.utils.NativeLogger);
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
        scheduler.addListener("workCompleted", e => {
          if (scheduler.getQueueSize() == 0) {
            console.log("All work completed");
            process.exit(0);
          }
        });
      }, 2000);
    }
  }
});
