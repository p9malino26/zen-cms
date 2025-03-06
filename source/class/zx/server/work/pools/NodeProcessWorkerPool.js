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
    /** Where the node process should run */
    nodeLocation: {
      init: "host",
      check: ["host", "container"]
    },

    hostNodeCommand: {
      init: ["./compiled/source-node/cli/index.js", "work", "start-worker"],
      nullable: false,
      check: "Array"
    },

    containerNodeCommand: {
      init: ["./puppeteer-server/index.js", "start-worker", "--launch-chromium"],
      nullable: false,
      check: "Array"
    }
  },

  members: {
    getFullNodeProcessCommandLine(nodeHttpPort, inspect, nodeDebugPort) {
      let nodeCmd;
      if (this.getNodeLocation() == "host") {
        nodeCmd = this.getHostNodeCommand();
      } else {
        nodeCmd = this.getContainerNodeCommand();
      }

      if (inspect !== "none") {
        nodeCmd.unshift(`--${inspect}=0.0.0.0:${nodeDebugPort}`);
        this.info(`Node process will be debuggable on port ${nodeDebugPort}`);
      }
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
