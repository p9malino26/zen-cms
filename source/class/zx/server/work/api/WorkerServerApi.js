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
 * API designed to run on a worker of a worker pool process,
 * which the pool communicates with.
 * The pool can tell the worker what task to run,
 * and the worker posts back messages regarding the status of the work back to the pool.
 */
qx.Class.define("zx.server.work.api.WorkerServerApi", {
  implement: [zx.server.work.IWorker],
  extend: zx.io.api.server.AbstractServerApi,

  /**
   * @param {string} apiPath
   */
  construct(apiPath) {
    super("zx.server.work.api.WorkerApi");
    zx.io.api.server.ConnectionManager.getInstance().registerApi(this, apiPath);
  },

  members: {
    /**
     * @override
     */
    _publications: {
      /**
       * Sent when a work logs a message
       * @type {object}
       * @prop {string} caller uuid of the work which called the log
       * @prop {string} message log message
       */
      log: true,

      /**
       * Sent when a work completes, whether successfully or not
       * @type {object}
       * @prop {string} caller uuid of the work which completed
       * @prop {boolean} success `true` if the completion was a safe return, `false` if the completion was an error
       * @prop {string} message return message for a successful completion, or an error message for an unsuccessful completion
       */
      complete: true
    },

    /**
     * @override zx.server.work.IWorker#run
     */
    async run(work) {
      let clazz = qx.Class.getByName(work.classname);
      if (!clazz) {
        throw new Error(`Cannot find class '${work.classname}'`);
      }
      let instance = new clazz(...work.args);
      instance.setExplicitUuid(work.uuid);

      if (!qx.Class.hasInterface(clazz, zx.server.work.IWork)) {
        throw new Error(`Class '${work.classname}' does not implement interface zx.server.work.IWork !`);
      }

      let uuid = work.uuid;
      const log = message => {
        if (qx.core.Environment.get("qx.debug")) {
          console.log(`[${instance.classname}:${uuid}] LOG: ${message}`);
        }
        this.publish("log", { caller: uuid, message });
      };
      try {
        let message = await instance.execute(log);
        if (qx.core.Environment.get("qx.debug")) {
          console.log(`[${instance.classname}:${uuid}] SUCCESS: ${message}`);
        }
        this.publish("complete", { caller: uuid, success: true, message });
      } catch (cause) {
        if (qx.core.Environment.get("qx.debug")) {
          console.log(`[${instance.classname}:${uuid}] FAILURE: ${cause.message}`);
        }
        this.publish("complete", { caller: uuid, success: false, message: cause.message });
      }
    }
  }
});
