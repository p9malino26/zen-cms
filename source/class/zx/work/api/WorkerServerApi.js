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
 * API designed to run on a worker of a worker pool,
 * which executes the piece of work (zx.work.IWork) that is passed to it.
 */
qx.Class.define("zx.work.api.WorkerServerApi", {
  implement: [zx.work.IWorker],
  extend: zx.io.api.server.AbstractServerApi,

  /**
   * @param {string} apiPath
   */
  construct(apiPath) {
    super("zx.work.api.WorkerApi");
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
     * @override zx.work.IWorker#run
     */
    async run(work) {
      let clazz = qx.Class.getByName(work.classname);
      if (!clazz) {
        throw new Error(`Cannot find class '${work.classname}'`);
      }
      let instance = new clazz(work.uuid, ...work.args);
      if (!(instance instanceof zx.work.AbstractWork)) {
        throw new Error(`Class '${work.classname}' is not an instance of zx.work.AbstractWork`);
      }
      let caller = instance.toUuid();
      const log = message => {
        if (qx.core.Environment.get("qx.debug")) {
          console.log(`[${instance.classname}:${caller}] LOG: ${message}`);
        }
        this.publish("log", { caller, message });
      };
      try {
        let message = await instance.execute(log);
        if (qx.core.Environment.get("qx.debug")) {
          console.log(`[${instance.classname}:${caller}] SUCCESS: ${message}`);
        }
        this.publish("complete", { caller, success: true, message });
      } catch (cause) {
        if (qx.core.Environment.get("qx.debug")) {
          console.log(`[${instance.classname}:${caller}] FAILURE: ${cause.message}`);
        }
        this.publish("complete", { caller, success: false, message: cause.message });
      }
    }
  }
});
