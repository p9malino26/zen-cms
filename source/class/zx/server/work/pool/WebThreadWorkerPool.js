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
 * The web worker pool runs work in a web worker
 *
 * @ignore(Worker)
 */
qx.Class.define("zx.server.work.pool.WebThreadWorkerPool", {
  /** @template {Worker} TWorker */
  extend: zx.server.work.pool.AbstractWorkerPool,

  /**
   * @param {object} poolConfig - config for {@link zx.utils.Pool}
   * @param {string} remoteAppPath - the server request path to the compiled entrypoint for the remote worker app.
   */
  construct(poolConfig, remoteAppPath) {
    super("/", poolConfig);
    this.getQxObject("pool").setFactory(this);
    this.__remoteAppPath = remoteAppPath;
    debugger;
    throw new Error("As of 13/02/2025, Web Workers are not supported yet because we don't know how to compile Qooxdoo for web workers!");
  },

  members: {
    /**
     * @override
     * @returns {Promise<zx.server.work.api.WorkerClientApi>}
     */
    async _createWorker(apiPath) {
      let webWorker = new Worker(this.__remoteAppPath, { name: apiPath });
      webWorker.addEventListener("messageerror", evt => console.error(evt.data));

      let resolver;
      let promise = new Promise(res => (resolver = res));
      webWorker.addEventListener("message", resolver, { once: true });
      await promise;
      webWorker.postMessage({ apiPath });

      return webWorker;
    },

    /**
     * @override
     */
    _createClientTransport() {
      return new zx.io.api.transport.webworker.WebWorkerClientTransport();
    }
  }
});
