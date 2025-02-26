qx.Class.define("zx.demo.server.work.dockerpeer.DockerPeerApp", {
  extend: qx.application.Basic,
  implement: [qx.application.IApplication],

  members: {
    async main() {
      qx.log.Logger.register(zx.utils.NativeLogger);
      let pool = new zx.server.work.pools.DockerWorkerPool().set({
        poolConfig: { minSize: 0, maxSize: 2 }
      });

      let scheduler = new zx.server.work.scheduler.QueueScheduler();
      zx.io.api.server.ConnectionManager.getInstance().registerApi(scheduler.getServerApi(), "/scheduler");

      let schedulerClientApi = zx.io.api.ApiUtils.createClientApi(zx.server.work.scheduler.ISchedulerApi, zx.io.api.ApiUtils.getClientTransport(), "/scheduler");
      pool.setSchedulerApi(schedulerClientApi);

      scheduler.pushWork({
        uuid: "uuid",
        classname: zx.demo.server.work.TestWork.classname,
        compatibility: [],
        args: []
      });
      scheduler.pushWork({
        uuid: "uuid",
        classname: zx.demo.server.work.ErrorWork.classname,
        compatibility: [],
        args: []
      });
      scheduler.addListener("complete", e => {
        console.log('schedulerServer.addListener("complete")', e.getData());
      });

      await pool.startup();
    },

    finalize() {},

    close() {},

    terminate() {}
  }
});
