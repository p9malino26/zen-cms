qx.Class.define("zx.demo.server.work.dockerpeer.DockerPeerApp", {
  extend: qx.application.Basic,
  implement: [qx.application.IApplication],

  members: {
    async main() {
      let pool = new zx.server.work.pools.DockerWorkerPool("/zx.work", {
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
      let schedulerClient = new zx.server.work.api.SchedulerClientApi(schedulerClientTransport);
      let schedulerServer = new zx.server.work.api.SchedulerServerApi();
      pool.setSchedulerApi(schedulerClient);
      schedulerServer.schedule({
        uuid: "uuid",
        classname: zx.demo.server.work.TestWork.classname,
        compatibility: [],
        args: []
      });
      schedulerServer.schedule({
        uuid: "uuid",
        classname: zx.demo.server.work.ErrorWork.classname,
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
