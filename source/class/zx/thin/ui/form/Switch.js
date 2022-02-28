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


qx.Class.define("zx.thin.ui.form.Switch", {
  extend: zx.thin.ui.form.AbstractSelector,

  properties: {
    /** Refine the main CSS class */
    cssClass: {
      init: "qx-switch",
      refine: true
    }
  },

  members: {
    _createInput() {
      this.add(this.getQxObject("track"));
      this.add(this.getQxObject("thumb"));
    },

    _createQxObjectImpl(id) {
      switch (id) {
        case "track":
          return <div className="qx-switch-track"></div>;

        case "thumb":
          var div = <div className="qx-switch-thumb"></div>;
          div.add(this.getQxObject("input"));
          return div;

        case "input":
          var wid = <input type="checkbox"></input>;
          wid.addListener("click", this._onInputChange, this);
          return wid;
      }
      return this.base(arguments, id);
    }
  }
});
