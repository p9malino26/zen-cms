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
 * This class is used to lock off access to controls, by presenting slightly shaded overlay, similar to
 * Modal, but not allowing anything past
 *
 */
qx.Class.define("zx.thin.core.ScreenLock", {
  extend: qx.html.Element,

  construct() {
    this.base(arguments);
    this.setCssClass("qx-screen-lock");
  },

  members: {
    __targets: null,
    __lockCount: 0,

    /**
     * Increment a lock counter, displaying the lock div if necessary
     */
    lock() {
      this.__lockCount++;
      if (this.__lockCount == 1) this.setVisible(true);
    },

    /**
     * Decrement a lock counter, hiding the lock div if necessary
     */
    unlock() {
      this.__lockCount--;
      if (this.__lockCount == 0) this.setVisible(false);
    },

    /**
     * @Override
     */
    _applyVisible(value, oldValue) {
      if (value) {
        if (!this.isInRoot()) {
          let root = qx.html.Element.getDefaultRoot();
          if (qx.core.Environment.get("qx.debug")) {
            this.assertTrue(!!root);
          }
          root.add(this);
        }
      }
      this.base(arguments, value, oldValue);
    }
  },

  statics: {
    /** @type{ScreenLock} the instance */
    __instance: null,

    /**
     * Gets the ScreenLock singleton instance, creates on if necessary
     *
     * @return {ScreenLock}
     */
    getInstance() {
      const ScreenLock = zx.thin.core.ScreenLock;
      if (!ScreenLock.__instance)
        ScreenLock.__instance = new zx.thin.core.ScreenLock();
      return ScreenLock.__instance;
    },

    /**
     * Sets the default ScreenLock singleton instance
     *
     * @param instance {ScreenLock}
     */
    setInstance(instance) {
      const ScreenLock = zx.thin.core.ScreenLock;
      if (qx.core.Environment.get("qx.debug")) {
        if (ScreenLock.__instance && instance) {
          qx.log.Logger.warn(
            ScreenLock,
            "Overwriting non-null ScreenLock instance"
          );
        }
      }
      ScreenLock.__instance = instance;
    }
  }
});
