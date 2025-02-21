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

const child_process = require("node:child_process");

/**
 * The localhost peer pool runs workers in a separate node process on the same machine
 */
qx.Class.define("zx.server.work.pools.NodeProcessWorkerPool", {
  extend: zx.server.work.WorkerPool,

  /**
   * @param {string} route - the base path on the node remote app for zx apis. Be certain that this exactly
   *  matches the route configured on the server, eg {@link zx.server.work.runtime.NodePeerService}
   * @param {object} poolConfig - config for {@link zx.utils.Pool}
   * @param {string} remoteAppPath - the path on disk to the compiled entrypoint for the remote worker app. .
   */
  construct(route, poolConfig, remoteAppPath) {
    super(route, poolConfig);
    this.__remoteAppPath = remoteAppPath;
  },

  properties: {
    /** Whether to make the child node process debuggable */
    nodeInspect: {
      init: "none",
      check: ["none", "inspect", "inspect-brk"]
    }
  },

  members: {
    /**
     * @override
     */
    async createPoolableEntity() {
      let httpPort = zx.server.PortRanges.getNodeHttpServerApiPortRange().allocate();
      let params = [this.__remoteAppPath, httpPort, apiPath];
      let inspect = this.getNodeInspect();
      if (inspect != "none") {
        params.unshift(`--${inspect}=0.0.0.0:${zx.server.PortRanges.getNodeDebugPortRange().allocate()}`);
      }

      let nodeProcess = child_process.spawn("node", params, {});

      let workerTracker = new zx.server.work.pools.NodeProcessWorkerTracker(this, nodeProcess, httpPort);
      await workerTracker.initialise();
      return workerTracker;
    },

    /**
     * @override
     */
    async destroyPoolableEntity(entity) {
      entity.killNodeProcess();
    }
  },

  statics: {
    READY_SIGNAL: "zx.server.work.pools.NodeProcessWorkerPool.READY_SIGNAL"
  }
});
