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

qx.Class.define("zx.thin.ui.container.Window", {
  extend: zx.thin.ui.container.AbstractWindow,

  construct() {
    super();
    this.initShowClose();
  },

  properties: {
    /** Refine the main CSS class */
    cssClass: {
      init: "qx-window",
      refine: true
    },

    /** Whether to show the close button in the header */
    showClose: {
      init: false,
      check: "Boolean",
      apply: "_applyShowClose",
      event: "changeShowClose"
    }
  },

  members: {
    /**
     * @Override
     */
    _createElements() {
      this.add(this.getQxObject("qx.window.app-bar"));
      this.add(this.getQxObject("qx.window.body"));
    },

    /**
     * @Override
     */
    _getMoverDragElement() {
      return this.getQxObject("qx.window.app-bar");
    },

    /**
     * Apply for `showClose`
     */
    _applyShowClose(value) {
      this.getQxObject("qx.window.btnClose").setVisible(value);
    },

    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "qx.window.app-bar":
          var comp = <div className="qx-window-app-bar"></div>;
          comp.add(this.getQxObject("qx.window.button-bar"));
          comp.add(this.getQxObject("qx.window.caption"));
          return comp;

        case "qx.window.button-bar":
          var comp = <div className="qx-window-button-bar"></div>;
          comp.add(this.getQxObject("qx.window.btnClose"));
          return comp;

        case "qx.window.btnClose":
          var btn = <button className="fa fa-window-close"></button>;
          btn.addListener("click", () => this.hide());
          btn.setVisible(this.isShowClose());
          return btn;
      }

      return super._createQxObjectImpl(id);
    }
  }
});
