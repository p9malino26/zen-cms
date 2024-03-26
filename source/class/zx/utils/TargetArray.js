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
 * Use when you want to bind an array to a callback. The callback gets called during the binding, and when the instance of the array changes, and when the array fires a change event
 * @see {zx.utils.Target}
 *
 * @example {
 * this.bind("foo.arrayProperty", new zx.utils.TargetArray((eventData, value, oldValue) => {
 *  let newValue = value;
 *  console.log("Array changed: ", JSON.stringify(value));
 * });
 *
 * // Callback will call during the bind call, and when this.getFoo() fires "changeArrayProperty", and when this.getFoo().getArrayProperty() fires "change"
 */
qx.Class.define("zx.utils.TargetArray", {
  extend: qx.core.Object,

  /**
   *
   * @param {(eventData: Object, value: qx.data.Array, oldValue: qx.data.Array) => void} callback
   * @param {*} context `this` context for the callback
   */
  construct(callback, context) {
    super();
    if (context) {
      callback = callback.bind(context);
    }
    this.__callback = callback;
  },

  properties: {
    value: {
      init: null,
      nullable: true,
      event: "changeValue",
      apply: "_applyValue"
    }
  },

  members: {
    __callback: null,

    /**
     * Apply for value
     */
    _applyValue(value, oldValue) {
      if (oldValue) {
        oldValue.removeListener("change", this._onArrayChange, this);
      }
      if (value) {
        value.addListener("change", this._onArrayChange, this);
      }

      this.__callback(
        {
          start: 0,
          end: value ? value.getLength() - 1 : -1,
          type: "add/remove",
          added: value ? value.toArray() : [],
          removed: oldValue ? oldValue.toArray() : []
        },

        value,
        oldValue
      );
    },

    /**
     * Called when the array changes
     * @param evt {Event} the event
     */
    _onArrayChange(evt) {
      this.__callback(evt.getData(), evt.getTarget(), null);
    }
  }
});
