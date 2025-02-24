qx.Class.define("zx.demo.server.work.LocalWorkApp", {
  extend: qx.application.Basic,

  members: {
    async main() {
      let server = new zx.server.Standalone();
      await server.start();

      let pool = new zx.server.work.pools.LocalWorkerPool({
        minSize: 5
      });

      let schedulerClientTransport = new zx.io.api.transport.loopback.LoopbackClientTransport();
      let schedulerServerTransport = new zx.io.api.transport.loopback.LoopbackServerTransport();
      schedulerClientTransport.connect(schedulerServerTransport);
      schedulerServerTransport.connect(schedulerClientTransport);

      let scheduler = new zx.server.work.scheduler.QueueScheduler();
      zx.io.api.server.ConnectionManager.getInstance().registerApi(scheduler.getServerApi(), "/scheduler");

      let schedulerClientApi = new zx.io.api.client.GenericClientApiProxy(zx.server.work.scheduler.ISchedulerApi, schedulerClientTransport, "/scheduler");
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
      }, 2000);
    }
  }
});
