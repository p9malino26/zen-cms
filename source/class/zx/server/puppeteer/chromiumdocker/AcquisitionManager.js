/**
 * This class is responsible for queuing requests to acquire a Chromium docker instance
 * and processing the requests when a Chromium docker instance becomes available.
 *
 * We do not use Tarn's default behaviour to do this becauese it does not give
 * meaninful error messages when an exception is thrown due to acquisition timeout.
 *
 * @typedef RequestInfo
 * @property {qx.Promise} promise The promise to resolve when a Chromium docker instance is acquired
 * @property {number} expiryTime The time in milliseconds when we throw a timeout exception
 */
qx.Class.define("zx.server.puppeteer.chromiumdocker.AcquisitionManager", {
  extend: qx.core.Object,
  /**
   *
   * @param {require("tarn").Pool} pool
   * @param {number} acquireTimeoutMs Timeout in milliseconds to wait for a docker instance to become available
   */
  construct(pool, acquireTimeoutMs) {
    super();
    this.__pool = pool;
    this.__acquireTimeoutMs = acquireTimeoutMs;
    this.__queue = [];
  },
  members: {
    /**
     * @type {require("tarn").Pool} The pool of Chromium docker instances
     */
    __pool: null,
    __acquireTimeoutMs: 0,
    /**
     * @type {RequestInfo[]}
     */
    __queue: null,

    /**
     * Acquires a Chromium docker instance.
     * If one isn't currently available because the pool is full,
     * we wait until one is available.
     * An exception is thrown if one isn't available within the timeout.
     *
     * @returns {qx.Promise<zx.server.puppeteer.chromiumdocker.ChromiumDocker>}
     */
    acquire() {
      let promise = new qx.Promise();
      this.__queue.push({ promise, expiryTime: new Date().getTime() + this.__acquireTimeoutMs });
      console.debug("docker queue length: " + this.__queue.length);
      this.__scheduleDequeue();
      return promise;
    },

    /**
     * Ensures that the dequeue process is scheduled in the future.
     */
    __scheduleDequeue(timeout = 0) {
      if (this.__dequeueTimeout) return;
      this.__dequeueTimeout = setTimeout(() => this.__dequeue(), timeout);
    },

    /**
     * Processes the queue.
     * Rejects any acquisition requests that have timeed out,
     * and acquires Chromium instances if there are any available.
     */
    async __dequeue() {
      if (this.__inDequeue) {
        throw new Error("Cannot dequeue while already dequeuing.");
      }

      this.__inDequeue = true;
      let pool = this.__pool;
      let queue = this.__queue;

      if (!queue.length) {
        throw new Error("Queue cannot be empty when a dequeue is attempted.");
      }

      // reject all promises for timed out acquisition requests
      for (let i = queue.length - 1; i >= 0; i--) {
        if (queue[i].expiryTime < new Date().getTime()) {
          queue[i].promise.reject(new Error("Timeout waiting for Chromium docker acquire."));
          queue.splice(i, 1);
        }
      }

      //try to aquire as many as possible until limit reached
      let mgr = zx.server.puppeteer.chromiumdocker.PoolManager.getInstance().getConfiguration();

      let lengthToDequeue = queue.length; ///Because stuff may be added to the queue while we are in the loop below,
      /// we only dequeue everything that is in the queue at the start of this
      console.log("debug: " + this.classname + " chromium docker pool size: " + pool.numUsed());
      for (let i = 0; i < lengthToDequeue && pool.numUsed() < mgr.maxPool; i++) {
        let item = queue.shift();
        let pendingAcquire = await pool.acquire();
        let docker = await pendingAcquire.promise;
        item.promise.resolve(docker);
      }

      this.__dequeueTimeout = null;
      this.__inDequeue = false;

      //If there are still requests in the queue, schedule another dequeue after one second.
      if (queue.length) {
        this.__scheduleDequeue(1000);
      }
    }
  }
});
