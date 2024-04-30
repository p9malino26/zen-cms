const Docker = require("dockerode");
const path = require("path");

/**
 * Manages an instance of docker containers with the zx-puppeteer-server image
 *
 * The static methods operate a pool of available containers
 */
qx.Class.define("zx.server.puppeteer.ChromiumDocker", {
  extend: qx.core.Object,

  destruct() {
    zx.server.puppeteer.ChromiumDocker.deleteInstance(this);
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
    /** @type{Integer} the port number that the docker container is exposed on */
    portNumber: null,

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

      let CD = zx.server.puppeteer.ChromiumDocker;
      let config = CD.__configuration;
      if (config.minPort > config.maxPort) {
        throw new Error("Invalid configuration for docker with minPort and maxPort");
      }

      let allPorts = {};
      for (let i = config.minPort; i <= config.maxPort; i++) {
        allPorts[i] = true;
      }
      for (let key in CD.__instances) {
        delete allPorts[CD.__instances[key].getPortNumber()];
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

      let appConfig = zx.server.puppeteer.ChromiumDocker.__configuration;
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
      zx.server.puppeteer.ChromiumDocker.initialise();
      try {
        this.__container = await zx.server.puppeteer.ChromiumDocker.__docker.createContainer(containerConfig);
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

        while (true) {
          try {
            let get = await zx.utils.Http.httpGet("http://localhost:" + this.__portNumber + "/json/version");
            let json = get.body;
            if (json) {
              this.__chromiumJson = json;
              this.setEndpoint(json.webSocketDebuggerUrl.replace(/localhost:9000/, "localhost:" + this.__portNumber));
              break;
            }
          } catch (ex) {
            this.warn("Chromium not yet started, waiting 3 seconds");
          }
          await zx.utils.Promisify.waitFor(3000);
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
      await zx.server.puppeteer.ChromiumDocker.release(this);
    },

    /**
     * Stops the container
     */
    async kill() {
      if (this.__running) {
        this.__running = false;
        await this.__container.kill();
      }
      await zx.server.puppeteer.ChromiumDocker.release(this);
    },

    /**
     * Releases the container
     */
    async release() {
      await zx.server.puppeteer.ChromiumDocker.release(this);
    }
  },

  statics: {
    /** @type{Docker} the connection to the Docker daemon */
    __docker: null,

    /** @type{Map<String,zx.server.puppeteer.ChromiumDocker} instances indexed by hash code */
    __instances: {},

    /**
     * @typedef {Object} Configuration
     * @property {Boolean|String} debug whether to enable debugging, and if so, how
     * @property {Object<String,*>} env environment variables to set
     * @property {Integer} maxPool the maximum size of the pool
     * @property {Integer} minPort the minimum port number
     * @property {Integer} maxPort the maximum port number
     * @property {String} imageName the name of the image to use
     * @property {String[]} extraHosts extra hosts to add to the container, in the form `host:ip`
     * @property {String[]} mounts folders to mount in the container, in the form `hostPath:containerPath`
     *
     * If `debug` is a string, then it should be in the form "type[:hostDebuggerPort]",
     * where `type` is either `inspect` or `inspect-brk`. If `hostDebuggerPort` is not
     * specified, it is 9229
     *
     * @type{Configuration} __configuration the configuration to use
     */
    __configuration: {
      debug: false,
      label: "zx-chromium-docker",
      env: {
        ZX_AUTO_RESTART: true
      },

      maxPool: 10,
      minPort: 9000,
      maxPort: 9100,
      imageName: "zenesisuk/zx-puppeteer-server:latest"
    },

    /**
     * @returns {Configuration} the configuration
     */
    getConfiguration() {
      return zx.server.puppeteer.ChromiumDocker.__configuration;
    },

    /**
     * Sets the configuration for containers
     *
     * @param {Configuration} configuration
     */
    setConfiguration(configuration) {
      zx.server.puppeteer.ChromiumDocker.__configuration = configuration;
    },

    /**
     * Makes sure that global initialisation is complete
     */
    initialise() {
      if (zx.server.puppeteer.ChromiumDocker.__docker == null) {
        zx.server.puppeteer.ChromiumDocker.__docker = new Docker();
      }
    },

    /**
     * Disposes of any unused containers
     */
    async cleanupOldContainers() {
      const CD = zx.server.puppeteer.ChromiumDocker;
      CD.initialise();

      let containers = await CD.__docker.listContainers({
        all: true
      });

      for (let containerInfo of containers) {
        if (containerInfo.Labels && containerInfo.Labels["zx.services.type"] == CD.__configuration.label) {
          let container = CD.__docker.getContainer(containerInfo.Id);
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
     * Removes all known containers in the pool
     */
    async cleanupPooledContainers() {
      const CD = zx.server.puppeteer.ChromiumDocker;
      if (CD.__pool) {
        let pool = CD.__pool;
        CD.__pool = null;
        await pool.destroy();
      }
    },

    /**
     * Creates an instance
     *
     * @return {zx.server.puppeteer.ChromiumDocker}
     */
    createInstance() {
      const CD = zx.server.puppeteer.ChromiumDocker;
      CD.initialise();

      let instance = new zx.server.puppeteer.ChromiumDocker();
      return (CD.__instances[instance.toHashCode()] = instance);
    },

    /**
     * Deletes an instance
     *
     * @param {zx.server.puppeteer.ChromiumDocker} instance
     */
    async deleteInstance(instance) {
      const CD = zx.server.puppeteer.ChromiumDocker;

      if (instance.isRunning()) {
        qx.log.Logger.error("Deleting a ChromiumDocker instance which is still running - this is a bad idea");

        await instance.stop();
      }
      if (CD.__pool) {
        CD.__pool.release(instance);
      }
      let hash = instance.toHashCode();
      delete CD.__instances[hash];

      if (CD.__pool && Object.keys(CD.__instances).length == 0) {
        let pool = CD.__pool;
        CD.__pool = null;
        await pool.destroy();
      }
    },

    /**
     * Returns the pool
     *
     * @return {Tarn}
     */
    _getPool() {
      const CD = zx.server.puppeteer.ChromiumDocker;
      if (!CD.__pool) {
        const { Pool } = require("tarn");
        CD.__pool = new Pool({
          async create() {
            let instance = CD.createInstance();
            await instance.createContainer();
            await instance.start();
            return instance;
          },

          async validate(instance) {
            return !instance.isDisposed() && instance.isRunning();
          },

          async destroy(instance) {
            await instance.stop();
            await instance.destroyContainer();
            instance.dispose();
          },

          log(message, logLevel) {
            qx.log.Logger.warn(`${logLevel}: ${message}`);
          },

          min: 1,
          max: zx.server.puppeteer.ChromiumDocker.__configuration.maxPool,
          destroyTimeoutMillis: 30000,
          //acquireTimeoutMillis: 3000000,
          //createTimeoutMillis: 3000000,
          propagateCreateError: true
        });
      }

      return CD.__pool;
    },

    /**
     * acquires from the pool
     *
     * @return {zx.server.puppeteer.ChromiumDocker}
     */
    async acquire() {
      const CD = zx.server.puppeteer.ChromiumDocker;
      let acquired = await CD._getPool().acquire();
      return await acquired.promise;
    },

    /**
     * Releases to the pool
     *
     * @return {zx.server.puppeteer.ChromiumDocker}
     */
    async release(instance) {
      const CD = zx.server.puppeteer.ChromiumDocker;
      if (instance.isRunning()) {
        await CD._getPool().release(instance);
      } else {
        instance.dispose();
      }
    }
  }
});
