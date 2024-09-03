const Docker = require("dockerode");

/**
 * This class manages a pool of Chromium docker instances
 */
qx.Class.define("zx.server.puppeteer.chromiumdocker.PoolManager", {
  type: "singleton",
  extend: qx.core.Object,

  construct() {
    super();

    //Initialize pool
    const { Pool } = require("tarn");
    let t = this;
    this.__pool = new Pool({
      async create() {
        let instance = t.createInstance();
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
      max: this.__configuration.maxPool,
      destroyTimeoutMillis: 30000,
      acquireTimeoutMillis: 10 * 60 * 1000,
      //createTimeoutMillis: 3000000,
      propagateCreateError: true
    });

    //Initialize acquisition manager
    this.__acquisitionManager = new zx.server.puppeteer.chromiumdocker.AcquisitionManager(this.__pool, this.__configuration.acquireTimeout * 1000);
  },

  members: {
    /**
     * @type {require("tarn").Pool}
     */
    __pool: null,
    /** @type{Docker} the connection to the Docker daemon */
    __docker: null,

    /** @type{Map<String,zx.server.puppeteer.chromiumdocker.ChromiumDocker} instances indexed by hash code */
    __instances: {},

    /**
     * @type {zx.server.puppeteer.chromiumdocker.AcquisitionManager}
     */
    __acquisitionManager: null,

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
      maxTimeToWaitForChromium: 240,
      acquireTimeout: 30,
      imageName: "zenesisuk/zx-puppeteer-server:latest"
    },

    /**
     * @returns {Configuration} the configuration
     */
    getConfiguration() {
      return this.__configuration;
    },

    /**
     * Sets the configuration for containers
     *
     * @param {Configuration} configuration
     */
    setConfiguration(configuration) {
      this.__configuration = configuration;
    },

    /**
     * Makes sure that global initialisation is complete
     */
    initialise() {
      if (this.__docker == null) {
        this.__docker = new Docker();
      }
    },

    getDocker() {
      return this.__docker;
    },

    /**
     * Disposes of any unused containers
     */
    async cleanupOldContainers() {
      this.initialise();

      let containers = await this.__docker.listContainers({
        all: true
      });

      for (let containerInfo of containers) {
        if (containerInfo.Labels && containerInfo.Labels["zx.services.type"] == this.__configuration.label) {
          let container = this.__docker.getContainer(containerInfo.Id);
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

    getInstances() {
      return this.__instances;
    },

    /**
     * Removes all known containers in the pool
     */
    async cleanupPooledContainers() {
      if (this.__pool) {
        let pool = this.__pool;
        this.__pool = null;
        await pool.destroy();
      }
    },

    /**
     * Creates an instance
     *
     * @return {zx.server.puppeteer.chromiumdocker.ChromiumDocker}
     */
    createInstance() {
      const CD = this;
      CD.initialise();

      let instance = new zx.server.puppeteer.chromiumdocker.ChromiumDocker();
      return (CD.__instances[instance.toHashCode()] = instance);
    },

    /**
     * Deletes an instance
     *
     * @param {zx.server.puppeteer.chromiumdocker.ChromiumDocker} instance
     */
    async deleteInstance(instance) {
      const CD = this;

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
      const CD = this;
      if (!CD.__pool) {
      }

      return CD.__pool;
    },

    /**
     * @returns {qx.Promise<zx.server.puppeteer.chromiumdocker.ChromiumDocker>}
     */
    async acquire() {
      return this.__acquisitionManager.acquire();
    },

    /**
     * Releases to the pool
     *
     * @return {zx.server.puppeteer.chromiumdocker.ChromiumDocker}
     */
    async release(instance) {
      const CD = this;
      if (instance.isRunning()) {
        await CD._getPool().release(instance);
      } else {
        instance.dispose();
      }
    }
  }
});
