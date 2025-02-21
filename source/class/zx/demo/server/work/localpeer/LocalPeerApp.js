qx.Class.define("zx.demo.server.work.localpeer.LocalPeerApp", {
  extend: qx.application.Basic,
  implement: [qx.application.IApplication],

  members: {
    async main() {
      let pool = new zx.server.work.pools.NodeProcessWorkerPool("/zx.work", {
        minSize: 0,
        maxSize: 2
      }).set({
        remoteServerRange: new zx.utils.Range(3000, 4000),
        nodeDebugRange: new zx.utils.Range(9000, 10_000)
      });

      let schedulerClientTransport = new zx.io.api.transport.loopback.LoopbackClientTransport();
      let schedulerServerTransport = new zx.io.api.transport.loopback.LoopbackServerTransport();
      schedulerClientTransport.connect(schedulerServerTransport);
      schedulerServerTransport.connect(schedulerClientTransport);

      let scheduler = new zx.server.work.scheduler.QueueScheduler();
      zx.io.api.server.ConnectionManager.getInstance().registerApi(scheduler.getServerApi(), "/scheduler");

      let schedulerClientApi = new zx.io.api.client.GenericClientApiProxy(zx.server.work.scheduler.ISchedulerApi, schedulerClientTransport, "/scheduler");
      pool.setSchedulerApi(schedulerClientApi);

      scheduler.pushWork({
        uuid: qx.util.Uuid.createUuidV4(),
        classname: zx.demo.server.work.TestWork.classname,
        compatibility: [],
        args: []
      });
      scheduler.pushWork({
        uuid: qx.util.Uuid.createUuidV4(),
        classname: zx.demo.server.work.TestWork.classname,
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
