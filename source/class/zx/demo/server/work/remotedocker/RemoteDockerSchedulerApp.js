const express = require("express");

qx.Class.define("zx.demo.server.work.remotedocker.RemoteDockerSchedulerApp", {
  extend: qx.application.Basic,
  implement: [qx.application.IApplication],

  objects: {
    app() {
      const app = express();
      app.use(zx.io.api.transport.http.ExpressServerTransport.jsonMiddleware());
      return app;
    }
  },

  members: {
    async main() {
      let app = this.getQxObject("app");
      new zx.io.api.transport.http.ExpressServerTransport(app, "/zx.work");

      let scheduler = new zx.server.work.scheduler.QueueScheduler();
      zx.io.api.server.ConnectionManager.getInstance().registerApi(scheduler.getServerApi(), "/scheduler");

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
      // TODO: add loads more worker which do real stuff, including a worker which goes to 'google.com' and takes a screenshot
      scheduler.addListener("complete", e => {
        console.log('schedulerServer.addListener("complete")', e.getData());
      });
      app.listen(4001, () => console.log(`Scheduler server is running on port ${4001}`));
    },

    finalize() {},

    close() {},

    terminate() {}
  }
});
