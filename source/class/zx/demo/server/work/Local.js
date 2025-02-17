qx.Class.define("zx.demo.server.work.Local", {
  extend: qx.application.Basic,

  members: {
    async main() {
      let pool = new zx.server.work.pool.LocalPool({
        minSize: 5
      });

      let schedulerClientTransport = new zx.io.api.transport.loopback.Client();
      let schedulerServerTransport = new zx.io.api.transport.loopback.Server();
      schedulerClientTransport.connect(schedulerServerTransport);
      schedulerServerTransport.connect(schedulerClientTransport);
      let schedulerClient = new zx.server.work.api.SchedulerClientApi(schedulerClientTransport, "/scheduler");
      let schedulerServer = new zx.server.work.api.SchedulerServerApi("/scheduler");
      pool.setSchedulerApi(schedulerClient);

      schedulerServer.addListener("complete", e => {
        console.log("schedulerServer: complete: ", e.getData());
      });

      await pool.startup();

      schedulerServer.schedule({
        uuid: qx.util.Uuid.createUuidV4(),
        classname: zx.demo.server.work.TestWork.classname,
        compatibility: [],
        args: []
      });

      setTimeout(() => {
        schedulerServer.schedule({
          uuid: qx.util.Uuid.createUuidV4(),
          classname: zx.demo.server.work.ErrorWork.classname,
          compatibility: [],
          args: []
        });
      }, 2000);
    }
  }
});
