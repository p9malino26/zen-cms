const Docker = require("dockerode");
const path = require("path");

/**
 * Manages an instance of docker containers with the zx-puppeteer-server image
 */
qx.Class.define("zx.server.puppeteer.ChromiumDocker", {
  extend: qx.core.Object,

  destruct() {
    zx.server.puppeteer.chromiumdocker.PoolManager.getInstance().deleteInstance(this);
  },

  properties: {
    /** Websockets enpoint for chromium - not set until the docker has started successfully */
    endpoint: {
      check: "String",
      event: "changeEndpoint"
    }
  },

  events: {
    /** Fired when chromium is no longer running (unexpectedly) */
    chromiumNotRunning: "qx.event.type.Event"
  },

  members: {
    __pool: null,
    /** @type{Integer} the port number that the docker container is exposed on */
    __portNumber: null,

    /** @type{Docker.Container} the container */
    __container: null,

    /** @type{Boolean?} running, null means not yet created */
    __running: null,

    /** @type{zx.utils.Timeout} the watchdog timer, to detect when chromium is shutdown */
    __watchdog: null,

    /**
     * Returns the Port number; will be null if the container has not yet been created
     *
     * @return {Number} the ID of the container
     */
    getPortNumber() {
      return this.__portNumber;
    },

    /**
     * Returns the URL for the Chromium endpoint
     */
    getUrl() {
      return "ws://localhost:" + this.__portNumber;
    },

    /**
     * Creates the container
     */
    async createContainer() {
      if (this.__container) {
        throw new Error("Cannot create container more than once!");
      }

      const isPortAvailable = async port => {
        return await new Promise((resolve, reject) => {
          var net = require("net");
          var tester = net
            .createServer()
            .once("error", function (err) {
              if (err.code != "EADDRINUSE") {
                return reject(err);
              }
              resolve(false);
            })
            .once("listening", () => {
              tester.once("close", () => resolve(true));
              tester.close();
            })
            .listen(port);
        });
      };

      let config = zx.server.puppeteer.chromiumdocker.PoolManager.getInstance().getConfiguration();
      if (config.minPort > config.maxPort) {
        throw new Error("Invalid configuration for docker with minPort and maxPort");
      }

      let allPorts = {};
      for (let i = config.minPort; i <= config.maxPort; i++) {
        allPorts[i] = true;
      }
      let mgr = zx.server.puppeteer.chromiumdocker.PoolManager.getInstance();
      for (let key in mgr.getInstances()) {
        delete allPorts[mgr.getInstances()[key].getPortNumber()];
      }
      for (let testPortNumber in allPorts) {
        if (await isPortAvailable(testPortNumber)) {
          this.__portNumber = testPortNumber;
          break;
        }
      }
      if (this.__portNumber === null) {
        throw new Error("No available ports in the range " + config.minPort + " to " + config.maxPort);
      }

      let appConfig = zx.server.puppeteer.chromiumdocker.PoolManager.getInstance().getConfiguration();
      let containerConfig = {
        Image: appConfig.imageName,
        name: "puppeteer-" + this.__portNumber,
        Labels: {
          "zx.services.type": appConfig.label
        },

        Env: ["CONNECTION_TIMEOUT=-1"],

        HostConfig: {
          AutoRemove: true,
          PortBindings: {
            "9000/tcp": [
              {
                HostPort: "" + this.__portNumber
              }
            ]
          }
        },

        ExposedPorts: {
          "9000/tcp": {}
        }
      };

      if (appConfig.env) {
        for (let key in appConfig.env) {
          containerConfig.Env.push(key + "=" + appConfig.env[key]);
        }
      }

      // This is for debugging our web server in the docker container from the host
      if (appConfig.debug) {
        let debugPortNumber = 9329 + (config.minPort - this.__portNumber);
        let str = typeof appConfig.debug == "string" ? appConfig.debug : "inspect:" + debugPortNumber;
        let segs = str.split(":");
        let type = segs[0];
        let hostPort = segs[1] || "" + debugPortNumber;
        containerConfig.Env.push(`ZX_NODE_INSPECT=--${type}=0.0.0.0`);
        containerConfig.HostConfig.PortBindings["9229/tcp"] = [{ HostPort: hostPort }];
        containerConfig.ExposedPorts["9229/tcp"] = {};
      }

      // This is for debugging the chromium page in the docker container from the host
      if (appConfig.debug) {
        let debugPortNumber = 9429 + (config.minPort - this.__portNumber);
        containerConfig.HostConfig.PortBindings["9001/tcp"] = [{ HostPort: "" + debugPortNumber }];
        containerConfig.ExposedPorts["9001/tcp"] = {};
      }

      if (appConfig.extraHosts) {
        containerConfig.HostConfig.ExtraHosts = appConfig.extraHosts;
      }

      if (appConfig.mounts) {
        containerConfig.HostConfig.Binds = [];
        for (let mount of appConfig.mounts) {
          let segs = mount.split(":");
          let hostPath = segs[0];
          let containerPath = segs[1];
          hostPath = path.resolve(hostPath);
          containerConfig.HostConfig.Binds.push(`${hostPath}:${containerPath}`);
        }
      }

      this.debug("Creating container: " + JSON.stringify(containerConfig, null, 2));
      mgr.initialise();
      try {
        this.__container = await mgr.getDocker().createContainer(containerConfig);
      } catch (ex) {
        console.error("Cannot create container: " + (ex.stack || ex));
        throw ex;
      }

      this.__running = false;
    },

    /**
     * Destroys the container
     */
    async destroyContainer() {
      if (this.isRunning()) {
        await this.stop();
      }
      try {
        await this.__container.remove();
      } catch (ex) {
        // Nothing
      }
    },

    /**
     * Returns whether the container has been started
     */
    isRunning() {
      return this.__running;
    },

    async isContainerRunning() {
      if (!this.__running) {
        return false;
      }
      let state = await this.__container.inspect();
      if (!state.State.Running) {
        this.__running = false;
      }
      return this.__running;
    },

    /**
     * Starts the container
     */
    async start() {
      if (!this.__running) {
        this.__running = true;
        await this.__container.start();

        let pass = 0;
        const TIME_BETWEEN_PASSES_MS = 3000;
        let maxPasses = zx.server.puppeteer.chromiumdocker.PoolManager.getInstance().getConfiguration().maxTimeToWaitForChromium / (TIME_BETWEEN_PASSES_MS / 1000);
        while (true) {
          pass++;
          try {
            let get = await zx.utils.Http.httpGet("http://localhost:" + this.__portNumber + "/json/version");
            let json = get.body;
            if (json) {
              this.__chromiumJson = json;
              this.setEndpoint(json.webSocketDebuggerUrl.replace(/localhost:9000/, "localhost:" + this.__portNumber));
              break;
            }
          } catch (ex) {
            this.warn(`Chromium not yet available on 'http://localhost:${this.__portNumber}/json/version', waiting 3 seconds: ${ex}`);
          }
          if (pass > maxPasses) {
            throw new Error("Chromium not available after " + pass + " attempts");
          }
          await zx.utils.Promisify.waitFor(TIME_BETWEEN_PASSES_MS);
        }

        this.__watchdog = new zx.utils.Timeout(1000, () => {
          if (!this.isContainerRunning()) {
            this.fireEvent("chromiumNotRunning");
            this.__watchdog.killTimer();
          }
        }).set({
          recurring: true
        });

        this.info("Chromium started: " + JSON.stringify(this.__chromiumJson, null, 2));
      }
    },

    /**
     * @returns {*} the JSON returned from Chromium's `/json/version` URL
     */
    getJsonVersion() {
      return this.__chromiumJson;
    },

    /**
     * Stops the container
     */
    async stop() {
      if (this.__running) {
        this.__running = false;
        await this.__container.stop();
      }
      await zx.server.puppeteer.chromiumdocker.PoolManager.getInstance().release(this);
    },

    /**
     * Stops the container
     */
    async kill() {
      if (this.__running) {
        this.__running = false;
        await this.__container.kill();
      }
      await zx.server.puppeteer.chromiumdocker.PoolManager.getInstance().release(this);
    },

    /**
     * Releases the container
     */
    async release() {
      await zx.server.puppeteer.chromiumdocker.PoolManager.getInstance().release(this);
    }
  },

  statics: {
    /**
     * @deprecated Use the method from zx.server.puppeteer.chromiumdocker.PoolManager.getInstance()
     * @returns {Configuration} the configuration
     */
    getConfiguration() {
      return zx.server.puppeteer.chromiumdocker.PoolManager.getInstance().getConfiguration();
    },

    /**
     * @deprecated Use the method from zx.server.puppeteer.chromiumdocker.PoolManager.getInstance()
     * Sets the configuration for containers
     *
     * @param {Configuration} configuration
     */
    setConfiguration(configuration) {
      zx.server.puppeteer.chromiumdocker.PoolManager.getInstance().setConfiguration(configuration);
    },

    /**
     * @deprecated Use the method from zx.server.puppeteer.chromiumdocker.PoolManager.getInstance()
     * Makes sure that global initialisation is complete
     */
    initialise() {
      zx.server.puppeteer.chromiumdocker.PoolManager.getInstance().initialise();
    },

    /**
     * @deprecated Use the method from zx.server.puppeteer.chromiumdocker.PoolManager.getInstance()
     * Disposes of any unused containers
     */
    async cleanupOldContainers() {
      zx.server.puppeteer.chromiumdocker.PoolManager.getInstance().cleanupOldContainers();
    },

    /**
     * @deprecated Use the method from zx.server.puppeteer.chromiumdocker.PoolManager.getInstance()
     * Removes all known containers in the pool
     */
    async cleanupPooledContainers() {
      zx.server.puppeteer.chromiumdocker.PoolManager.getInstance().cleanupPooledContainers();
    },

    /**
     * Creates an instance
     * @deprecated Use the method from zx.server.puppeteer.chromiumdocker.PoolManager.getInstance()
     *
     * @return {zx.server.puppeteer.ChromiumDocker}
     */
    createInstance() {
      zx.server.puppeteer.chromiumdocker.PoolManager.getInstance().createInstance();
    },

    /**
     * @deprecated Use the method from zx.server.puppeteer.chromiumdocker.PoolManager.getInstance()
     * Deletes an instance
     *
     * @param {zx.server.puppeteer.ChromiumDocker} instance
     */
    async deleteInstance(instance) {
      zx.server.puppeteer.chromiumdocker.PoolManager.getInstance().deleteInstance();
    },

    // async tryDequeue() {
    //   mutex = mutex.then(async () => {
    //     if (pool.getUsed() < this.max) {
    //       let docker = await pool.acquire();
    //       let promise = queue.shift();
    //       promise.resolve(docker);
    //     }
    //   });
    //   await mutex;

    //   if (queue.length > 0) {
    //     scheduleDequeue();
    //   }
    // },

    // scheduleDequeue() {
    //   if (timeout) return;
    //   timeout = setTimeout(async () => {
    //     await tryDequeue();
    //     timeout = null;
    //   }, 500);
    // },
    /**
     * @deprecated Use the method from zx.server.puppeteer.chromiumdocker.PoolManager.getInstance()
     * acquires from the pool
     *
     * @return {Promise<zx.server.puppeteer.ChromiumDocker>}
     */
    async acquire() {
      return zx.server.puppeteer.chromiumdocker.PoolManager.getInstance().acquire();
    },

    /**
     * @deprecated Use the method from zx.server.puppeteer.chromiumdocker.PoolManager.getInstance()
     * Releases to the pool
     *
     * @return {zx.server.puppeteer.ChromiumDocker}
     */
    async release(instance) {
      return zx.server.puppeteer.chromiumdocker.PoolManager.getInstance().release(instance);
    }
  }
});
