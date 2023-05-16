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
 *    John Spackman (john.spackman@zenesis.com, @johnspackman)
 *
 * ************************************************************************ */

/**
 * Operates a promise based mutex, ie where a series of functions are added to
 * an array, and will be processed one at a time with promise chaining.
 */
qx.Class.define("zx.utils.Mutex", {
  extend: qx.core.Object,

  construct() {
    super();
    this.__tasks = [];
  },

  members: {
    __tasks: null,
    __running: false,

    /**
     * Runs a task, sequentially with other tasks to this Mutex
     *
     * @param {Function} fn the task to complete
     * @returns {*} whatever `fn` returns
     */
    async run(fn) {
      let data = {
        fn,
        promise: new qx.Promise()
      };
      this.__tasks.push(data);

      if (!this.__running) {
        zx.utils.Mutex.__NEXTTICK(() => this.__processor());
      }

      return await data.promise;
    },

    /**
     * Runs the queue of tasks
     */
    async __processor() {
      if (this.__running) {
        return;
      }

      this.__running = true;
      while (this.__tasks.length) {
        let data = this.__tasks.shift();
        try {
          let result = await data.fn();
          data.promise.resolve(result);
        } catch (ex) {
          data.promise.reject(ex);
        }
      }
      this.__running = false;
    }
  },

  statics: {
    __NEXTTICK: null
  },

  /**
   * @ignore(process)
   */
  defer(statics) {
    if (typeof process !== "undefined") statics.__NEXTTICK = process.nextTick;
    else statics.__NEXTTICK = fn => setTimeout(fn, 0);
  }
});
