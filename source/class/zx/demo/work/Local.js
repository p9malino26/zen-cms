qx.Class.define("zx.demo.work.Local", {
  extend: qx.application.Basic,

  members: {
    async main() {
      let pool = new zx.work.pool.LocalPool({
        minSize: 5
      });

      let schedulerClientTransport = new zx.io.api.transport.loopback.Client();
      let schedulerServerTransport = new zx.io.api.transport.loopback.Server();
      schedulerClientTransport.connect(schedulerServerTransport);
      schedulerServerTransport.connect(schedulerClientTransport);
      let schedulerClient = new zx.work.api.SchedulerClientApi(schedulerClientTransport, "/scheduler");
      let schedulerServer = new zx.work.api.SchedulerServerApi("/scheduler");
      pool.setSchedulerApi(schedulerClient);
      schedulerServer.schedule({
        uuid: "uuid",
        classname: zx.demo.work.TestWork.classname,
        compatibility: [],
        args: []
      });
      schedulerServer.addListener("complete", e => {
        console.log('schedulerServer.addListener("complete")', e.getData());
      });

      await pool.startup();
    }
  }
});
