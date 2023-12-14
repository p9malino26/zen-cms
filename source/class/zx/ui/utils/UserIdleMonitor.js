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

qx.Class.define("zx.ui.utils.UserIdleMonitor", {
  extend: zx.utils.Timeout,

  construct(duration, callback, context) {
    super(duration, callback, context);

    this.__onUserEventHandler = qx.lang.Function.bind(this.__onUserEvent, this);
    for (var i = 0, NAMES = zx.ui.utils.UserIdleMonitor.__NAMES; i < NAMES.length; i++) {
      qx.bom.Event.addNativeListener(document, NAMES[i], this.__onUserEventHandler, true);
    }

    this.__lastEventTime = new Date().getTime();
  },

  destruct() {
    for (var i = 0, NAMES = zx.ui.utils.UserIdleMonitor.__NAMES; i < NAMES.length; i++) {
      qx.bom.Event.removeNativeListener(document, NAMES[i], this.__onUserEventHandler, true);
    }
  },

  members: {
    __onUserEventHandler: null,
    __lastEventTime: 0,

    /**
     * Event handler for various native DOM events that indicate user activity
     */
    __onUserEvent(evt) {
      this.__lastEventTime = new Date().getTime();
      this.resetTimer();
    },

    /**
     * Returns the length of time the user has been inactive
     */
    getIdleTimeElapsed() {
      return new Date().getTime() - this.__lastEventTime;
    },

    /**
     * Time of the last user activity
     */
    getLastEventTime() {
      return this.__lastEventTime;
    }
  },

  statics: {
    __NAMES: "mousemove keydown DOMMouseScroll mousewheel mousedown".split(" "),

    __instance: null,

    getInstance() {
      if (!this.__instance) {
        this.__instance = new zx.ui.utils.UserIdleMonitor();
      }
      return this.__instance;
    }
  }
});
