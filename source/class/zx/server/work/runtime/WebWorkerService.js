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

/**
 * An app to host workers running in node worker threads
 *
 * @ignore(self)
 */
qx.Class.define("zx.server.work.runtime.WebWorkerService", {
  extend: qx.application.Basic,

  members: {
    async main() {
      if (typeof self.postMessage !== "function") {
        let processKind = typeof window === "undefined" ? "a server process" : "the main process";
        console.warn(
          `${this.classname} is designed for use in a web worker and should not be executed in ${processKind}. Some features may not work correctly, others may cause the application to crash.`
        );
      }

      let promise = new Promise(res => self.addEventListener("message", evt => res(evt.data.apiPath), { once: true }));
      self.postMessage("ready");
      new zx.server.work.api.WorkerServerApi(await promise);
      new zx.io.api.transport.webworker.WebWorkerServerTransport();
    }
  }
});
