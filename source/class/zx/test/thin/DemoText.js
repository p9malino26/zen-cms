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

qx.Class.define("zx.test.thin.DemoText", {
  extend: zx.thin.ui.container.Window,

  construct() {
    super();
    this.setCaption("Demo Text");
    let body = this.getBody();
    body.add(<h2>Demo of the text input field</h2>);
    row.add(this.getQxObject("txtOne"));
    this.setStyles({
      width: 400
    });
  },

  properties: {
    inline: {
      init: true,
      refine: true
    },

    centered: {
      init: "both",
      refine: true
    }
  },

  members: {
    _createQxObjectImpl(id) {
      switch (id) {
        case "txtOne":
          var btn = new zx.thin.ui.form.Text("");
          return btn;
      }

      return super._createQxObjectImpl(id);
    }
  }
});
