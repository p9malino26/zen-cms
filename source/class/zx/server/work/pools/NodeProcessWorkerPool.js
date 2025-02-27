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

    /** What folder to map into the /home/pptruser/app folder in the container */
    appMountVolume: {
      init: "compiled/source-node",
      check: "String"
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
    },

    /** Whether to enable Chromium in the remote node process */
    enableChromium: {
      init: true,
      check: "Boolean"
    },

    /** Docker image name to use for containers */
    dockerImage: {
      init: "zenesisuk/zx-puppeteer-server-base:latest",
      check: "String"
    },

    /** How long to wait for the node process to shutdown gracefully */
    shutdownTimeout: {
      init: 10000,
      check: "Integer"
    },

    /** @type{String[]?} array of mounts, in the form "sourcePath:containerPath", all paths must be absolute */
    dockerMounts: {
      init: null,
      nullable: true,
      check: "Array"
    },

    /** Command to run in docker */
    dockerCommand: {
      init: "/home/pptruser/bin/start.sh",
      nullable: true,
      check: "String"
    },

    /** Label used to identify old containers, so that they can be cleaned up */
    dockerServicesTypeLabel: {
      init: "zx-worker",
      check: "String"
    }
  },

  members: {
    getFullNodeProcessCommandLine(nodeHttpPort, inspect, nodeDebugPort) {
      let nodeCmd = this.getNodeCommand();
      if (inspect !== "none") {
        nodeCmd.unshift(`--${inspect}=0.0.0.0:${nodeDebugPort}`);
        this.info(`Node process will be debuggable on port ${nodeDebugPort}`);
      }
      nodeCmd.push(`--port=${nodeHttpPort}`);
      return nodeCmd;
    },

    async cleanupOldContainers() {
      const Docker = require("dockerode");
      let docker = new Docker();
      let containers = await docker.listContainers({
        all: true
      });

      for (let containerInfo of containers) {
        if (containerInfo.Labels && containerInfo.Labels["zx.services.type"] == this.getDockerServicesTypeLabel()) {
          let container = docker.getContainer(containerInfo.Id);
          if (containerInfo.State == "running") {
            try {
              await container.kill();
            } catch (ex) {
              // Nothing
            }
          }
          try {
            await container.remove();
          } catch (ex) {
            // Nothing
          }
        }
      }
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
