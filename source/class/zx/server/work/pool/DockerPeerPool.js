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

const Docker = require("dockerode");
const path = require("node:path");

/**
 * The docker peer pool runs workers in a docker container
 */
qx.Class.define("zx.server.work.pool.DockerPeerPool", {
  /** @template {import('dockerode').Container} TWorker */
  extend: zx.server.work.pool.AbstractPeerPool,

  environment: {
    /**
     * Resolved relative to the user home directory `/home/zxWorker` in the container (your `compiled` directory will be automatically linked into the home directory)
     */
    "zx.server.work.pool.DockerPeerPool.remoteAppPath": "./app/demo-work-docker-peer-service/index.js",
    /**
     * How the docker peer's node process should be started for debugging, if at all.
     * Options:
     * - "" (empty string) - no debugging (forced if qx.debug=false)
     * - "inspect" - start the docker's node process with the --inspect flag and a random free port within this.nodeDebugRange (default if qx.debug=true)
     * - "break" - start the docker's node process with the --inspect-brk flag and a random free port within this.nodeDebugRange
     */
    "zx.server.work.pool.DockerPeerPool.inspector": "inspect",
    /**
     * The docker image to use for the worker by default
     */
    "zx.server.work.pool.DockerPeerPool.imageName": "zenesisuk/zx-puppeteer-server-base"
  },

  /**
   * @param {string} route - the base path on the node remote app for zx apis. Be certain that this exactly matches the route configured on the server, eg {@link zx.server.work.runtime.ExpressService}
   * @param {object} config - config for {@link zx.utils.Pool}
   * @param {string} image - the docker image to use. Note: it is expected that the user in the container will be named `zxWorker`
   * @param {string} [remoteAppPath] - the path on disk to the compiled entrypoint for the remote worker app. The app will likely extend {@link zx.server.work.runtime.ExpressService}. If not provided, defaults to the environment variable `zx.server.work.pool.DockerPeerPool.remoteAppPath` (this environment variable defaults to the application named 'demo-work-docker-peer-service' built in source mode)
   */
  construct(route, config, image, remoteAppPath) {
    super(config);
    if (route.endsWith("/")) {
      route = route.substring(0, route.length - 1);
    }
    if (!route.startsWith("/")) {
      route = `/${route}`;
    }
    this.__route = route;
    this.__remoteAppPath = remoteAppPath ?? qx.core.Environment.get("zx.server.work.pool.DockerPeerPool.remoteAppPath");
    this.__docker = new Docker();
    this.__image = image ?? qx.core.Environment.get("zx.server.work.pool.DockerPeerPool.imageName");
  },

  members: {
    /**
     * @abstract
     * @param {number} port
     * @param {string} apiPath
     * @returns {Promise<zx.server.work.api.WorkerClientApi>}
     */
    async _createWorker(port, apiPath) {
      const SERVER_PORT = 3000;
      const TCP_SPEC = `${SERVER_PORT}/tcp`;
      let params = [path.join("/home/pptruser", this.__remoteAppPath), `${SERVER_PORT}`, apiPath];
      if (qx.core.Environment.get("qx.debug")) {
        switch (qx.core.Environment.get("zx.server.work.pool.DockerPeerPool.inspector")) {
          case "inspect":
            params.unshift(`--inspect=0.0.0.0`);
            break;
          case "break":
            params.unshift(`--inspect-brk=0.0.0.0`);
            break;
        }
      }

      let ExposedPorts = { [TCP_SPEC]: {} };
      let PortBindings = { [TCP_SPEC]: [{ HostPort: port.toString() }] };

      if (qx.core.Environment.get("qx.debug")) {
        let nodeDebugRange = this.getNodeDebugRange();
        ExposedPorts["9229/tcp"] = {};
        PortBindings["9229/tcp"] = [{ HostPort: nodeDebugRange.acquire().toString() }];
      }
      /**@type {import('dockerode').ContainerCreateOptions}*/
      let config = {
        Image: this.__image,
        name: `zx-worker-${port}`,
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
      let container = await this.__docker.createContainer(config);
      container._config = config;

      let prefix = `[${this.classname}: node ${params.slice(-3).join(" ")}]`;

      let resolved = false;
      let promise = new Promise(resolve => {
        container.attach({ stream: true, stdout: true, stderr: false }, (err, stream) => {
          if (err) {
            console.error(err);
            return;
          }
          stream.on("data", data => {
            if (!resolved) {
              if (data.toString().includes(zx.server.work.pool.DockerPeerPool.READY_SIGNAL)) {
                resolve();
                resolved = true;
              }
              return;
            }
            console.log(`${prefix} stdout: ${data}`);
          });
        });
      });
      container.attach({ stream: true, stdout: false, stderr: true }, (err, stream) => {
        if (err) {
          console.error(err);
          return;
        }
        stream.on("data", data => console.error(`${prefix} stderr: ${data}`));
      });

      await container.start();
      console.log(`[${this.classname}] spawned worker, waiting for ready signal...`);
      await promise;
      console.log(`[${this.classname}] worker ready`);
      return container;
    },

    /**
     * @override
     * @param {number} port
     * @param {string} apiPath
     * @returns {zx.io.api.client.AbstractClientTransport}
     */
    _createClient(port, apiPath) {
      let host = `http://localhost:${port}`;
      let transport = new zx.io.api.transport.http.HttpClientTransport(host + this.__route);
      let client = new zx.server.work.api.WorkerClientApi(transport, apiPath);
      return client;
    },

    /**
     * @override
     * @param {import('dockerode').Container} peerProcess
     * @param {() => void} cleanup - must be called once the worker has been destroyed
     */
    _destroyWorker(peerProcess, cleanup) {
      peerProcess.kill(() => {
        cleanup();
        if (qx.core.Environment.get("qx.debug")) {
          let port = peerProcess._config.HostConfig.PortBindings["9229/tcp"][0].HostPort;
          this.getNodeDebugRange().release(port);
        }
      });
    }
  },

  statics: {
    READY_SIGNAL: "zx.server.work.pool.DockerPeerPool.READY_SIGNAL"
  }
});
