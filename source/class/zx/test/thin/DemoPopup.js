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


qx.Class.define("zx.test.thin.DemoPopup", {
  extend: zx.thin.ui.container.Window,

  construct() {
    this.base(arguments);
    this.setCaption("Demo Popup");
    let body = this.getBody();
    body.add(<h2>Demo of creating windows on the fly</h2>);
    let row = <div></div>;
    body.add(row);
    row.add(this.getQxObject("buttonOne"));
    this.setCentered("both");
    this.setStyles({
      width: 400
    });
  },

  properties: {
    inline: {
      init: true,
      refine: true
    }
  },

  members: {
    _createQxObjectImpl(id) {
      switch (id) {
        case "buttonOne":
          var btn = new zx.thin.ui.form.Button("Create Window").set({
            buttonStyle: "contained"
          });
          btn.addListener("execute", () => {
            this.info("Button One");
            let win = new zx.test.thin.DemoHelloWindow();
            win.setModal(true);
            win.open();
          });
          return btn;
      }
      return this.base(arguments, id);
    }
  }
});
