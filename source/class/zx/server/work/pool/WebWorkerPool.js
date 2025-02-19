/* ************************************************************************
 *
 *  Zen [and the art of] CMS
 *
 *  https://zenesis.com
 *
 *  Copyright:
 *    2019-2022 Zenesis Ltd, https://www.zenesis.com
 *
 *  License:
 *    MIT (see LICENSE in project root)
 *
 *  Authors:
 *    Will Johnson (@willsterjohnson)
 *
 * ************************************************************************ */

/**
 * The web worker pool runs work in a web worker
 *
 * @ignore(Worker)
 */
qx.Class.define("zx.server.work.pool.WebWorkerPool", {
  /** @template {Worker} TWorker */
  extend: zx.server.work.pool.AbstractThreadWorkerPool,
  implement: [zx.server.work.IWorkerFactory],

  environment: {
    "zx.server.work.pool.WebWorkerPool.remoteAppPath": "/demo-work-web-worker-service/index.js"
  },

  /**
   * @param {object} config - config for {@link zx.utils.Pool}
   * @param {string} [remoteAppPath] - the server request path to the compiled entrypoint for the remote worker app. The app will likely extend {@link zx.server.work.runtime.NodeWorkerApp}. If not provided, defaults to the environment variable `zx.server.work.pool.WebWorkerPool.remoteAppPath` (this environment variable defaults to the application named 'demo-work-web-worker-service' built in source mode)
   */
  construct(config, remoteAppPath) {
    super(this, config);
    console.warn("As of 13/02/2025, Web Workers are not supported yet because we don't know how to compile Qooxdoo for web workers!");
    debugger;
    this.getQxObject("pool").setFactory(this);
    this.__remoteAppPath = remoteAppPath ?? qx.core.Environment.get("zx.server.work.pool.WebWorkerPool.remoteAppPath");
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
