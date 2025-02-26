/* ************************************************************************
 *
 *  Zen [and the art of] CMS
 *
 *  https://zenesis.com
 *
 *  Copyright:
 *    2019-2025 Zenesis Ltd, https://www.zenesis.com
 *
 *  License:
 *    MIT (see LICENSE in project root)
 *
 *  Authors:
 *    John Spackman (@johnspackman)
 *    Will Johnson (@willsterjohnsonatzenesis)
 *
 * ************************************************************************ */

const { isMainThread, workerData } = require("node:worker_threads");

/**
 * An app to host workers running in node worker threads
 */
qx.Class.define("zx.server.work.runtime.NodeWorkerService", {
  extend: qx.application.Basic,

  members: {
    async main() {
      qx.log.Logger.register(zx.utils.NativeLogger);
      if (isMainThread) {
        let currentExecution = typeof window !== "undefined" ? "a browser" : "the main process";
        console.warn(
          `zx.server.work.runtime.NodeWorkerApp is designed for use in a worker thread and should not be executed in ${currentExecution}. Some features may not work correctly, others may cause the application to crash.`
        );
      }
      let worker = new zx.server.work.Worker();
      zx.io.api.server.ConnectionManager.getInstance().registerApi(worker.getServerApi(), "/work/worker");
      new zx.io.api.transport.nodeworker.NodeWorkerServerTransport();
    }
  }
});
