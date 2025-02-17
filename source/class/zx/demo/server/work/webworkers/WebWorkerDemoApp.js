/**
 * NOTE: As of 13/02/2025, web wor
 */
qx.Class.define("zx.demo.server.work.webworkers.WebWorkerDemoApp", {
  extend: qx.application.Native,
  implement: [qx.application.IApplication],

  members: {
    async main() {
      let pool = new zx.server.work.pool.WebWorkerPool({
        minSize: 0,
        maxSize: 2
      });

      let schedulerClientTransport = new zx.io.api.transport.loopback.Client();
      let schedulerServerTransport = new zx.io.api.transport.loopback.Server();
      schedulerClientTransport.connect(schedulerServerTransport);
      schedulerServerTransport.connect(schedulerClientTransport);
      let schedulerClient = new zx.server.work.api.SchedulerClientApi(schedulerClientTransport, "/scheduler");
      let schedulerServer = new zx.server.work.api.SchedulerServerApi("/scheduler");
      pool.setSchedulerApi(schedulerClient);
      schedulerServer.schedule({
        uuid: "uuid",
        classname: zx.demo.server.work.TestWork.classname,
        compatibility: [],
        args: []
      });
      schedulerServer.addListener("complete", e => {
        console.log('schedulerServer.addListener("complete")', e.getData());
      });

      await pool.startup();
    },

    finalize() {},

    close() {},

    terminate() {}
  }
});
