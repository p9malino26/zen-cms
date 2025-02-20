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

/**
 * A worker pool maintains and manages a pool of workers
 *
 * Implementations of this class is responsible to creating and destroying those
 * processes, allocating work to them, and communicating with the scheduler to
 * receive work to do and report back the status of the work to the scheduler.
 *
 */
qx.Class.define("zx.server.work.pool.AbstractWorkerPool", {
  extend: qx.core.Object,
  implement: [zx.server.work.IWorkerFactory],

  construct(route, poolConfig) {
    super();

    if (route.endsWith("/")) {
      route = route.substring(0, route.length - 1);
    }
    if (!route.startsWith("/")) {
      route = `/${route}`;
    }
    this.__route = route;
    this.setPoolConfig(poolConfig);

    this.__pendingMessages = [];
    this.__currentWork = {};

    let api = new zx.server.work.api.WorkerPoolServerApi(this);
    zx.io.api.server.ConnectionManager.getInstance().registerApi(api, "/pool");
  },

  properties: {
    /**
     * Config options for the internal {@link zx.utils.Pool}
     * @type {object} config - configuration options for the pool. These can be changed at any time with the corresponding property
     * @prop {number} [config.minSize] - the minimum number of resources to keep alive in the pool (impacts idle overhead)
     * @prop {number} [config.maxSize] - the maximum number of resources to create in the pool (impacts maximum load)
     * @prop {number} [config.timeout] - the number of milliseconds to wait for a resource to become available before failing
     * @prop {number} [config.pollInterval] - the number of milliseconds between checks for available resources
     */
    poolConfig: {
      init: null,
      nullable: true,
      check: "Object",
      event: "changePoolConfig",
      apply: "_applyPoolConfig"
    },

    schedulerApi: {
      check: "zx.server.work.api.SchedulerClientApi"
    },

    pollInterval: {
      check: "Integer",
      init: 5_000,
      event: "changePollInterval"
    },

    pushInterval: {
      check: "Integer",
      init: 10_000,
      event: "changePushInterval"
    },

    /**
     * The maximum number of push messages to send at once
     * A higher or lower limit may be appropriate depending on where workers, this pool, and the scheduler are running
     */
    maxPushMessages: {
      check: "Integer",
      init: 100
    }
  },

  objects: {
    pool() {
      let pool = new zx.utils.Pool();
      pool.setFactory(this);
      pool.addListener("becomeAvailable", () => {
        console.log("pool sent becomeAvailable");
        this.getQxObject("pollTimer").startTimer();
      });
      pool.addListener("becomeUnavailable", () => {
        console.log("pool sent becomeUnavailable");
        this.getQxObject("pollTimer").killTimer();
      });
      return pool;
    },

    pollTimer() {
      const onPoll = async () => {
        console.log(`[${this.classname}]: polling for work...`);
        let work;
        if (!this.getQxObject("pool").available()) return;

        try {
          work = await this.getSchedulerApi().poll(this.classname);
        } catch (e) {
          console.log(`[${this.classname}]: failed to poll for work: ${e}`);
          return;
        }
        if (work) {
          console.log(`[${this.classname}]: received work!`);
          /**@type {zx.server.work.api.WorkerClientApi} */

          //Do not await this because it will cause us not to poll until this IWork is finished
          this.getQxObject("pool")
            .acquire()
            .then(async worker => {
              this.__currentWork[work.uuid] = {
                worker,
                work,
                startTime: new Date()
              };
              try {
                await worker.run(work);
              } catch (e) {
                console.error(`[${this.classname}]: error running work`, e);
                debugger;
              }
              delete this.__currentWork[work.uuid];
              this.getQxObject("pushTimer").fire();
              this.getQxObject("pool").release(worker);
            });
        }
      };

      let pollTimer = new zx.utils.Timeout(null, onPoll);
      pollTimer.setRecurring(true);
      this.bind("pollInterval", pollTimer, "duration");
      return pollTimer;
    },

    pushTimer() {
      const onPush = async () => {
        this.__sortPending();
        let currentPending = this.__pendingMessages.splice(0, Math.min(this.__pendingMessages.length, this.getMaxPushMessages()));
        if (!currentPending.length) {
          return;
        }
        try {
          console.log(`[${this.classname}]: pushing ${currentPending.length} messages...`);
          await this.getSchedulerApi().push(currentPending);
        } catch (e) {
          console.log(`[${this.classname}]: failed to push messages`);
          debugger;
          // the server running the scheduler is down - re-add the pending messages and try again later
          this.__pendingMessages.unshift(...currentPending);
        }
      };

      let pushTimer = new zx.utils.Timeout(null, onPush);
      pushTimer.setRecurring(true);
      this.bind("pushInterval", pushTimer, "duration");
      return pushTimer;
    }
  },

  members: {
    /**
     * Info about the pieces of work that are current running,
     * index by the UUID of the work
     *
     * @typedef CurrentWorkInfo
     * @property {zx.server.work.api.WorkerClientApi} worker - the worker API
     * @property {zx.server.work.IWorkSpec} work - the work spec
     * @property {Date} startTime - the time the work started
     * @type {Map<string, CurrentWorkInfo>}
     */
    __currentWork: null,

    /**@type {zx.server.work.IMessageSpec[]}*/
    __pendingMessages: null,

    /**
     * Apply for `poolConfig` property
     */
    _applyPoolConfig(value, oldValue) {
      let pool = this.getQxObject("pool");
      ["minSize", "maxSize", "timeout", "pollInterval"].forEach(prop => {
        let upname = qx.lang.firstUp(prop);
        if (value[prop] !== undefined) {
          pool["set" + upname](value[prop]);
        } else {
          pool["reset" + qx.lang.firstUp(prop)](value[prop]);
        }
      });
    },

    getRoute() {
      return this.__route;
    },

    /**
     * @Override
     */
    createPoolableEntity() {
      throw new Error(`Abstract method ${this.classname}.createPoolableEntity from IPoolFactory not implemented`);
    },

    /**
     * @Override
     */
    destroyPoolableEntity(entity) {
      throw new Error(`Abstract method ${this.classname}.destroyPoolableEntity from IPoolFactory not implemented`);
    },

    /**
     *
     * @param {string} uuid
     */
    killWork(uuid) {
      if (!this.__currentWork[uuid]) {
        throw new Error("No work with that UUID");
      }
      this.__currentWork[uuid].worker.terminate();
      delete this.__currentWork[uuid];
    },

    /**
     *
     * @returns {Object} Information about all the current work that is running
     */
    getStatusJson() {
      return Object.values(this.__currentWork).map(info => ({
        uuid: info.work.uuid,
        classname: info.work.classname,
        startTime: info.startTime
      }));
    },

    /**
     * Get information about a current work that is running
     *
     * @param {string} uuid
     * @returns {Object}
     */
    getWorkerStatusJson(uuid) {
      let info = this.__currentWork[uuid];
      if (!info) {
        throw new Error("No work with that UUID");
      }

      let outstandingLogs = this.__pendingMessages.filter(msg => msg.caller === uuid);

      let out = {
        outstandingLogs,
        startTime: info.startTime.toISOString()
      };

      return out;
    },

    /**
     * Utility to generate uniform api paths
     * @param {string} apiName - human-readable name of the api. Must be unique within the class
     * @returns {string} the path in the form `/{{classname}}/{{uuid}}/{{apiName}}/{{randomUuid}}`
     */
    _createPath(apiName) {
      return `/${this.classname}/${this.toUuid()}/${apiName}/${qx.util.Uuid.createUuidV4()}`;
    },

    /**
     * Instruct the pool to start creating workers and polling for work
     */
    async startup() {
      await this.getQxObject("pool").startup();
      this.getQxObject("pollTimer").startTimer();
      this.getQxObject("pushTimer").startTimer();
    },

    /**
     * Shut down the pool and all pooled workers
     *
     * Shutdown will wait for all pending messages to send before shutting down, unless a destructiveMs is provided
     * @param {number} [forceAfterMs] - the number of milliseconds to wait before forcibly shutting down. Use any negative value to wait indefinitely. Defaults to -1.
     */
    async shutdown(forceAfterMs = -1) {
      this.getQxObject("pollTimer").killTimer();

      let startTime = Date.now();
      while (this.__pendingMessages.length) {
        await new Promise(r => setTimeout(r, this.getPushInterval()));
        if (forceAfterMs >= 0 && Date.now() - startTime > forceAfterMs) {
          break;
        }
      }
      this.getQxObject("pushTimer").killTimer();
      await this.getQxObject("pool").shutdown();
    },

    __sortPending() {
      this.__pendingMessages.sort((a, b) => a.time - b.time);
    }
  }
});
