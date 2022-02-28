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

qx.Class.define("zx.utils.TargetArray", {
  extend: qx.core.Object,

  construct: function (callback, context) {
    this.base(arguments);
    if (context) callback = callback.bind(context);
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
    _applyValue: function (value, oldValue) {
      if (oldValue)
        oldValue.removeListener("change", this._onArrayChange, this);
      if (value) value.addListener("change", this._onArrayChange, this);

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
    _onArrayChange: function (evt) {
      this.__callback(evt.getData(), evt.getTarget(), null);
    }
  }
});
