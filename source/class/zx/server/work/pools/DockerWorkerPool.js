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

const Docker = require("dockerode");
const path = require("node:path");

/**
 * The docker peer pool runs workers in a docker container
 */
qx.Class.define("zx.server.work.pools.DockerWorkerPool", {
  /** @template {import('dockerode').Container} TWorker */
  extend: zx.server.work.pools.WorkerPool,

  environment: {
    /**
     * The docker image to use for the worker by default
     */
    "zx.server.work.pools.DockerWorkerPool.imageName": "zenesisuk/zx-puppeteer-server-base"
  },

  /**
   * @param {object} poolConfig - config for {@link zx.utils.Pool}
   * @param {string} image - the docker image to use. Note: it is expected that the user in the container will be named `zxWorker`
   * @param {string} [remoteAppPath] - the path on disk to the compiled entrypoint for the remote worker app.
   */
  construct(poolConfig, image, remoteAppPath) {
    super(poolConfig);
    this.__remoteAppPath = remoteAppPath ?? qx.core.Environment.get("zx.server.work.pools.DockerWorkerPool.remoteAppPath");
    this.__docker = new Docker();
    this.__image = image ?? qx.core.Environment.get("zx.server.work.pools.DockerWorkerPool.imageName");
  },

  properties: {
    /** Whether to make the child node process inside the container debuggable */
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
      let chromiumPort = zx.server.PortRanges.getChromiumPortRange().allocate();
      const SERVER_PORT = 3000;
      const TCP_SPEC = `${SERVER_PORT}/tcp`;
      let params = [path.join("/home/pptruser", this.__remoteAppPath), `${SERVER_PORT}`];
      let inspect = this.getNodeInspect();
      if (inspect != "none") {
        params.unshift(`--${inspect}=0.0.0.0`);
      }

      let ExposedPorts = { [TCP_SPEC]: {} };
      let PortBindings = { [TCP_SPEC]: [{ HostPort: String(chromiumPort) }] };

      if (inspect != "none") {
        let nodeDebugPort = zx.server.PortRanges.getNodeDebugPortRange().acquire();
        ExposedPorts["9229/tcp"] = {};
        PortBindings["9229/tcp"] = [{ HostPort: String(nodeDebugPort) }];
      }
      /**@type {import('dockerode').ContainerCreateOptions}*/
      let dockerConfig = {
        Image: this.__image,
        name: `zx-worker-${chromiumPort}`,
        AttachStderr: true,
        AttachStdout: true,
        Env: [`ZX_NODE_ARGS=${params.join(" ")}`, "ZX_MODE=worker"],
        ExposedPorts,
        Tty: true,
        HostConfig: {
          AutoRemove: true,
          Binds: [`${process.cwd()}/compiled/source-node:/home/pptruser/app/`],
          PortBindings
        }
      };
      let container = await this.__docker.createContainer(dockerConfig);
      let workerTracker = new zx.server.work.pools.DockerWorkerTracker(this, container, dockerConfig);
      await workerTracker.initialise();
      container._config = dockerConfig;
    },

    /**
     * @override
     */
    async destroyPoolableEntity(entity) {
      entity.killDockerContainer();
    }
  }
});
