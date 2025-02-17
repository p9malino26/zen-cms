qx.Class.define("zx.demo.server.work.remotedocker.PoolApp", {
  extend: qx.application.Basic,
  implement: [qx.application.IApplication],

  members: {
    async main() {
      let pool = new zx.server.work.pool.DockerPeerPool("/zx.work", {
        minSize: 0,
        maxSize: 2
      }).set({
        remoteServerRange: new zx.utils.Range(3000, 4000),
        nodeDebugRange: new zx.utils.Range(9000, 10_000)
      });

      let transport = new zx.io.api.transport.http.HttpClientTransport("http://localhost:4001/zx.work");
      let scheduler = new zx.server.work.api.SchedulerClientApi(transport, "/scheduler");
      pool.setSchedulerApi(scheduler);
      await pool.startup();
    },

    finalize() {},

    close() {},

    terminate() {}
  }
});
