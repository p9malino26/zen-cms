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


qx.Class.define("zx.thin.core.Modal", {
  extend: qx.html.Element,

  construct() {
    this.base(arguments);
    this.__targets = [];
    this.setCssClass("qx-modal");
  },

  properties: {
    zIndex: {
      init: 1000,
      check: "Integer"
    }
  },

  members: {
    __targets: null,

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
    },

    /**
     * Adds a target to the list of modal elements; the target will be made "top most",
     * and if it already exists will be moved to the top
     *
     * @param target {Element}
     */
    pushTarget(target) {
      qx.lang.Array.remove(this.__targets, target);
      this.__targets.push(target);
      this.__updateTargets();
    },

    /**
     * Removes a target from the list, and if it is the top most the previous target will
     * become topmost
     *
     * @param target {Element}
     */
    removeTarget(target) {
      qx.lang.Array.remove(this.__targets, target);
      this.__updateTargets();
    },

    /**
     * Updates the list of targets so that they appear in order on the screen
     */
    __updateTargets() {
      this.__targets.forEach(target => target.setStyle("z-index", null));
      let target = this.__targets.length
        ? this.__targets[this.__targets.length - 1]
        : null;
      if (target) target.setStyle("z-index", this.getZIndex() + 1000);
      this.setVisible(!!target);
    }
  },

  statics: {
    /** @type{Modal} the instance */
    __instance: null,

    /**
     * Gets the Modal singleton instance, creates on if necessary
     *
     * @return {Modal}
     */
    getInstance() {
      const Modal = zx.thin.core.Modal;
      if (!Modal.__instance) Modal.__instance = new zx.thin.core.Modal();
      return Modal.__instance;
    },

    /**
     * Sets the default Modal singleton instance
     *
     * @param instance {Modal}
     */
    setInstance(instance) {
      const Modal = zx.thin.core.Modal;
      if (qx.core.Environment.get("qx.debug")) {
        if (Modal.__instance && instance) {
          qx.log.Logger.warn(Modal, "Overwriting non-null Modal instance");
        }
      }
      Modal.__instance = instance;
    }
  }
});
