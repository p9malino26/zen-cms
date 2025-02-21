/**
 * NOTE: As of 13/02/2025, web workers do not work yet because we don't know how to compile Qooxdoo for web workers.
 */
qx.Class.define("zx.demo.server.work.webworkers.WebWorkerApp", {
  extend: qx.application.Native,
  implement: [qx.application.IApplication],

  members: {
    async main() {
      let pool = new zx.server.work.pools.WebThreadWorkerPool({
        minSize: 0,
        maxSize: 2
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
        uuid: "uuid",
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
