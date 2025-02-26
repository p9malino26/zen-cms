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
      init: null,
      nullable: true,
      check: "Array"
    }
  },

  members: {
    /**
     * @override
     */
    async createPoolableEntity() {
      let httpPort = zx.server.PortRanges.getNodeHttpServerApiPortRange().acquire();
      let nodeDebugPort = null;
      let nodeCmd = this.getNodeCommand();
      if (!nodeCmd) {
        nodeCmd = [process.argv[1], "work", "start-worker", "--port", httpPort];
      }
      let inspect = this.getNodeInspect();
      if (inspect != "none") {
        nodeDebugPort = zx.server.PortRanges.getNodeDebugPortRange().acquire();
        nodeCmd.unshift(`--${inspect}=0.0.0.0:${nodeDebugPort}`);
        this.info(`Node process will be debuggable on port ${nodeDebugPort}`);
      }

      this.debug("Running command: " + nodeCmd.join(" "));
      let nodeProcess = child_process.spawn("node", nodeCmd, {});

      let workerTracker = new zx.server.work.pools.NodeProcessWorkerTracker(this, nodeProcess, httpPort, nodeDebugPort);
      await workerTracker.initialize();
      return workerTracker;
    },

    /**
     * @override
     */
    async destroyPoolableEntity(entity) {
      entity.killNodeProcess();
      entity.dispose();
    }
  }
});
