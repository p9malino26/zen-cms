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

qx.Class.define("zx.utils.Queue", {
  extend: qx.core.Object,

  /**
   * Constructor
   *
   * @param {Function?} handler callback to process each item
   */
  construct(handler) {
    this.base(arguments);
    this.__queue = [];
    if (handler) this.setHandler(handler);
  },

  properties: {
    /** The function that processes each item */
    handler: {
      check: "Function",
      event: "changeHandler"
    }
  },

  members: {
    /** @type{Object[]} the queue */
    __queue: null,

    /**
     * Adds an object to the queue
     *
     * @param {Object} item
     * @return {Promise} promise that results with the results of the handler for the item
     */
    push(item) {
      let data = {
        item: item,
        promise: new qx.Promise()
      };
      this.__queue.push(data);
      if (!this.__running) zx.utils.Queue.__NEXTTICK(() => this._run());
      return data.promise;
    },

    /**
     * Processes all items in the queue
     */
    async _run() {
      this.__running = true;
      while (this.__queue.length) {
        let data = this.__queue.shift();
        let handler = this.getHandler();
        try {
          let result = await handler(data.item);
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
