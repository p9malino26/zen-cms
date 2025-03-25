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
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */

/**
 * A class useful when you want to invoke a debounced function while passing in a value.
 *
 *
 * @example
 *
 * let timeout = 1000; // timeout in ms
 *
 * let debounce = new zx.utils.DebounceByValue(timeout, person => {
 *    person.syncWithDatabase();
 * });
 *
 * let p1 = new Person("Alice");
 * let p2 = new Person("Bob");
 *
 * debounce.scheduleRun(p1);
 * debounce.scheduleRun(p2);
 *
 * In this case, for a particular instance of Person,
 * when debounce.run hasn't been called for that person in the last second (timeout is set to 1000 ms),
 * person.syncWithDatabase will be called, for that person.
 *
 * @template T @extends qx.core.Object The type of object for which we will have separate debounces. In above example, T is Person.
 * @typedef {(obj: T) => void} Callback
 */
qx.Class.define("zx.utils.DebounceByValue", {
  extend: qx.core.Object,

  /**
   * @param {number} timeout Initial value for property `timeout`
   * @param {Callback} callback Initial value for property `callback`
   */
  construct(timeout, callback) {
    super();

    this.__debounces = {};

    if (callback) {
      this.setCallback(callback);
    }

    if (timeout) {
      this.setTimeout(timeout);
    }
  },

  properties: {
    /**
     * Given some object `obj`, `this.callback(obj)` will be called if the last call to `this.scheduleRun(obj)` was over 'this.timeout' ms ago.
     */
    timeout: {
      init: 250,
      nullable: false,
      apply: "_applyTimeout",
      check: "Integer",
      event: "changeTimeout"
    },

    /**
     * @type {Callback}
     * Function to be called when, given some object `obj`, the last call to `this.scheduleRun(obj)` was over `this.timeout` ms ago.
     */
    callback: {
      nullable: false,
      check: "Function",
      event: "changeCallback"
    }
  },

  members: {
    /**
     * @type {Record<string, zx.utils.Debounce>}
     *
     * Maps the hashcode of the debounces objects (of type T) to their respective debouncers.
     */
    __debounces: null,

    _applyTimeout(value, oldValue) {
      for (let debounce of Object.values(this.__debounces)) {
        debounce.setTimeout(value);
      }
    },

    /**
     * Schedules a run to `this.callback`
     * @param {T} value
     */
    scheduleRun(value) {
      let debounce = this.__debounces[value.toHashCode()];
      if (!debounce) {
        debounce = new zx.utils.Debounce(() => this.getCallback()(value), this.getTimeout()).set({ repeatedTrigger: "restart" });
        this.__debounces[value.toHashCode()] = debounce;
      }
      return debounce.run().then(() => {
        delete this.__debounces[value.toHashCode()];
      });
    }
  }
});
