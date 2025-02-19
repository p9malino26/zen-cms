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
 * Server api for work scheduling.
 * An instance of this class runs on the scheduler and is used for getting instances of work to do
 * and for uploading information regarding the status of the work.
 *
 * This class also functions as the scheduler itself, keeping track of work and distributing it to pools
 */
qx.Class.define("zx.server.work.api.SchedulerServerApi", {
  extend: zx.io.api.server.AbstractServerApi,

  /**
   *
   * @param {string} path
   */
  construct(path) {
    super("zx.server.work.api.SchedulerApi");
    zx.io.api.server.ConnectionManager.getInstance().registerApi(this, path);

    this.__pendingWork = new zx.utils.PrioritizedList();
    this.__messages = new Map();
  },

  members: {
    /**@type {zx.utils.PrioritizedList<zx.server.work.IWorkSpec>}*/
    __pendingWork: null,

    /**@type {Map<string, zx.server.work.IMessageSpec[]>} */
    __messages: null,

    /**
     * Adds a work description to the queue, which will then be fetched by a worker pool and the executed in one of its workers
     * @param {zx.server.work.IWorkSpec} workConfig
     */
    schedule(workConfig) {
      this.__pendingWork.add(workConfig, workConfig.priority ?? 5);
    },

    /**
     * REMOTE METHOD
     * Gets the next piece of work to do,
     * if there is one
     *
     * @param {string} classname - classname of the caller, used to determine compatibility with work
     * @returns {Promise<zx.server.work.IWorkSpec | null>} work data, or an empty object if no work is available
     */
    async poll(classname) {
      return this.__pendingWork.takeFirst(workConfig => !workConfig.compatibility.length || workConfig.compatibility.includes(classname));
    },

    /**
     * REMOTE METHOD
     * Called by the worker pool to push messages back to the scheduler
     * @param {zx.server.work.IMessageSpec[]} messages - messages to push
     */
    async push(messages) {
      console.log(`received ${messages.length} messages`);
      for (let message of messages) {
        if (!this.__messages.has(message.caller)) {
          this.__messages.set(message.caller, []);
        }
        this.__messages.get(message.caller).push(message);
        if (message.kind === "success" || message.kind === "failure") {
          let allMessages = this.__messages.get(message.caller);
          this.__messages.delete(message.caller);
          this.fireDataEvent("complete", allMessages);
        }
      }
    }
  }
});
