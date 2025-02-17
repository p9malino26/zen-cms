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

/**
 * This class represents a pool of processes which can run the work tasks.
 * They can be child processes, worker threads, docker containers, etc.
 *
 * This class is responsible to creating and destroying those processes,
 * allocating work to them,
 * and communicating with the scheduler to receive work to do and report back the status of the work to the scheduler.
 * @template TWorker An opaque object representing the worker process
 */
qx.Class.define("zx.server.work.pool.AbstractPeerPool", {
  extend: zx.server.work.AbstractWorkerPool,

  /**
   * @param {object} config - config for {@link zx.utils.Pool}
   */
  construct(config) {
    super();
    this.__workerMap = new Map();
    this.setPoolConfig(config);
    this.getQxObject("pool").setFactory(this);
  },

  properties: {
    /**
     * The pool of port numbers for the servers running on the workers
     */
    remoteServerRange: {
      check: "zx.utils.Range"
    },

    /**
     * The pool of port numbers for the debugging the workers
     */
    nodeDebugRange: {
      check: "zx.utils.Range"
    }
  },

  members: {
    /**@type {Map<zx.server.work.api.WorkerClientApi, {process: TWorker, port: number}>} */
    __workerMap: null,

    /**
     * @abstract
     * Creates the worker process (can be a child process, a worker thread, docker container etc)
     * and returns an opaque object representing the worker
     *
     * @param {number} port The port on which the server will run on the worker
     * @param {string} apiPath The path at which to mount the instance of zx.server.work.api.WorkerServerApi
     * @returns {TWorker | Promies<TWorker>} an opaque object representing the worker process.
     *  This can be a Node worker, Browser worker, Docker container, child process, etc.
     */
    async _createWorker(port, apiPath) {
      throw new Error(`Abstract method _createWorker of class ${this.classname} not implemented`);
    },

    /**
     * @abstract
     * Creates a client api to communicate with the worker
     * @param {number} port Port at which the worker server is running
     * @param {string} apiPath The path at which to mount the instance of zx.server.work.api.WorkerServerApi on the worker
     * @returns {zx.io.api.client.AbstractClientApi}
     */
    _createClient(port, apiPath) {
      throw new Error(`Abstract method _createClient of class ${this.classname} not implemented`);
    },

    /**
     * @abstract
     * Cleanly shuts down the worker process
     * @param {TWorker} peerProcess The opaque object representing the worker, returned by `_createWorker`
     * @param {() => void} cleanup - must be called once the worker has been destroyed
     */
    _destroyWorker(peerProcess, cleanup) {
      throw new Error(`Abstract method _destroyWorker of class ${this.classname} not implemented`);
    },

    /**
     * Creates a new worker and returns an API to communicate with it
     * @returns {Promise<zx.server.work.api.WorkerClientApi>}
     */
    async create() {
      let apiPath = this._createPath("workerApi");
      let port = this.getRemoteServerRange().acquire();

      let peerProcess = await this._createWorker(port, apiPath);
      let client = this._createClient(port, apiPath);

      this.__workerMap.set(client, [peerProcess, port]);

      await client.subscribe("log", this._onLog.bind(this));
      await client.subscribe("complete", this._onComplete.bind(this));
      return client;
    },

    /**
     * Destroys a worker entirely
     * @param {zx.server.work.api.WorkerClientApi} client
     */
    async destroy(client) {
      let result = this.__workerMap.get(client);
      if (!result) {
        return;
      }
      let [peerProcess, port] = result;
      await client.unsubscribe("log");
      await client.unsubscribe("complete");

      this._destroyWorker(peerProcess, () => this.getRemoteServerRange().release(port));
      this.__workerMap.delete(client);
      client.dispose();
    }
  }
});
