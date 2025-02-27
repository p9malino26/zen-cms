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
  extend: zx.server.work.pools.WorkerPool,

  /**
   * @param {String} workdir the working directory for the pool
   */
  construct(workdir) {
    super(workdir);
  },

  properties: {
    /** Whether to make the child node process debuggable */
    nodeInspect: {
      init: "none",
      check: ["none", "inspect", "inspect-brk"]
    },

    /** The command line to pass to node, defaults to this app using the command line "work start-worker" */
    nodeCommand: {
      init: ["./runtime/puppeteer-server/index.js", "start-worker"],
      nullable: true,
      check: "Array"
    },

    /** Where the node process should run */
    nodeLocation: {
      init: "host",
      check: ["host", "container"]
    }
  },

  members: {
    getFullNodeProcessCommandLine(nodeHttpPort, chromiumUrl, inspect, nodeDebugPort) {
      let nodeCmd = this.getNodeCommand();
      if (inspect !== "none") {
        nodeCmd.unshift(`--${inspect}=0.0.0.0:${nodeDebugPort}`);
        this.info(`Node process will be debuggable on port ${nodeDebugPort}`);
      }
      nodeCmd.push(`--chromium-url=${chromiumUrl}`);
      nodeCmd.push(`--port=${nodeHttpPort}`);
      return nodeCmd;
    },

    /**
     * @override
     */
    async createPoolableEntity() {
      let workerTracker = new zx.server.work.pools.NodeProcessWorkerTracker(this);
      await workerTracker.initialize();
      return workerTracker;
    },

    /**
     * @override
     */
    async destroyPoolableEntity(entity) {
      await entity.close();
      entity.dispose();
    }
  }
});
