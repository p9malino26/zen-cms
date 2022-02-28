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


qx.Class.define("zx.test.thin.DemoButtons", {
  extend: zx.thin.ui.container.Window,

  construct() {
    this.base(arguments);
    this.setCaption("Demo Buttons");
    let body = this.getBody();
    body.add(<h2>Demo of the various button styles</h2>);
    let row = <div></div>;
    body.add(row);
    row.add(this.getQxObject("buttonOne"));
    row.add(this.getQxObject("buttonTwo"));
    row = <div></div>;
    body.add(row);
    row.add(this.getQxObject("buttonThree"));
    row.add(this.getQxObject("buttonFour"));
    row = <div></div>;
    body.add(row);
    row.add(this.getQxObject("buttonLoading"));
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
          var btn = new zx.thin.ui.form.Button("Button One").set({
            buttonStyle: "contained"
          });
          btn.addListener("execute", () => {
            this.info("Button One");
          });
          return btn;

        case "buttonTwo":
          var btn = new zx.thin.ui.form.Button("Button Two").set({
            buttonStyle: "contained",
            icon: "@FontAwesomeSolid/heart"
          });
          btn.addListener("execute", () => {
            this.info("Button One");
          });
          return btn;

        case "buttonThree":
          var btn = new zx.thin.ui.form.Button("Button Three").set({
            buttonStyle: "outlined"
          });
          btn.addListener("execute", () => {
            this.info("Button Three");
          });
          return btn;

        case "buttonFour":
          var btn = new zx.thin.ui.form.Button("Button Four").set({
            buttonStyle: "text",
            icon: "@FontAwesomeSolid/heart"
          });
          btn.addListener("execute", () => {
            this.info("Button Four");
          });
          return btn;

        case "buttonLoading":
          var btn = new zx.thin.ui.form.Button("Loading Button").set({
            buttonStyle: "contained",
            icon: "@FontAwesomeSolid/heart",
            loadingStyle: "ball-clip-rotate-multiple"
          });
          btn.addListener("execute", () => {
            this.info("Button Loading");
            btn.setLoading(true);
            let lock = zx.thin.core.ScreenLock.getInstance();
            lock.setVisible(true);
            setTimeout(() => {
              lock.setVisible(false);
              btn.setLoading(false);
            }, 1000);
          });
          return btn;
      }
      return this.base(arguments, id);
    }
  }
});
