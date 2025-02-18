qx.Class.define("zx.demo.server.work.nodeworkers.NodeWorkerApp", {
  extend: qx.application.Basic,

  members: {
    async main() {
      let pool = new zx.server.work.pool.NodeWorkerPool({
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
        uuid: "fb339301-3f9c-45ed-a774-7bf0a026c5eb",
        classname: zx.demo.server.work.TestWork.classname,
        compatibility: [],
        args: []
      });

      schedulerServer.schedule({
        uuid: "e32a5baa-470d-40c5-a9d4-2ccced32f75f",
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
