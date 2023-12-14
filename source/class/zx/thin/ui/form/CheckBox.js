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

qx.Class.define("zx.thin.ui.form.CheckBox", {
  extend: zx.thin.ui.form.AbstractSelector,

  properties: {
    /** Refine the main CSS class */
    cssClass: {
      init: "qx-checkbox",
      refine: true
    }
  },

  members: {
    _createInput() {
      this.add(this.getQxObject("input"));
      this.add(this.getQxObject("overlay"));
    },

    _createQxObjectImpl(id) {
      switch (id) {
        case "input":
          var wid = <input type="checkbox"></input>;
          wid.addListener("click", this._onInputChange, this);
          return wid;

        case "overlay":
          return (
            <svg viewBox="0 0 24 24">
              <path fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59"></path>
            </svg>
          );
      }

      return super._createQxObjectImpl(id);
    }
  }
});
