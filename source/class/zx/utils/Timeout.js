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

qx.Class.define("zx.utils.Timeout", {
  extend: qx.core.Object,

  construct(duration, callback, context) {
    this.base(arguments);
    this.__onTimeoutBound = this._onTimeout.bind(this);
    if (duration) this.setDuration(duration);
    if (callback) this.addListener("timeout", callback, context);
  },

  destruct: function () {
    this.killTimer();
  },

  properties: {
    duration: {
      init: 5000,
      nullable: false,
      check: "Integer",
      event: "changeDuration",
      apply: "_applyXxxx"
    },

    recurring: {
      init: false,
      nullable: false,
      check: "Boolean",
      apply: "_applyXxxx"
    }
  },

  events: {
    timeout: "qx.event.type.Event",
    reset: "qx.event.type.Event"
  },

  members: {
    __timerId: null,
    __onTimeoutBound: null,

    _applyXxxx() {
      if (this.__timerId) this.resetTimer();
    },

    /**
     * Starts the timer
     */
    startTimer() {
      var dur = this.getDuration();
      if (this.__timerId == null && dur > 0) {
        this.__timerId = setTimeout(this.__onTimeoutBound, dur);
        this.fireEvent("reset");
      }
    },

    /**
     * Kills the timer
     */
    killTimer() {
      if (this.__timerId) {
        clearTimeout(this.__timerId);
        this.__timerId = null;
      }
    },

    /**
     * Resets the timer
     */
    resetTimer() {
      this.killTimer();
      this.startTimer();
    },

    /**
     * Fires the timer
     */
    fire() {
      this.fireEvent("timeout");
    },

    /**
     * Event handler for timeouts
     */
    _onTimeout(evt) {
      this.__timerId = null;
      this.fire();
      if (this.isRecurring()) this.startTimer();
    }
  }
});
