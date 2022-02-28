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


qx.Class.define("zx.test.thin.DemoSelection", {
  extend: zx.thin.ui.container.Window,

  construct() {
    this.base(arguments);
    this.setCaption("Demo Selection");
    let body = this.getBody();
    body.add(<h2>Demo of the various selection styles</h2>);
    let row = <div></div>;
    body.add(row);
    row.add(this.getQxObject("checkboxOne"));
    row.add(this.getQxObject("checkboxTwo"));
    row = <div></div>;
    body.add(row);
    row.add(this.getQxObject("radioOne"));
    row.add(this.getQxObject("radioTwo"));
    row = <div></div>;
    body.add(row);
    row.add(this.getQxObject("radioThree"));
    row.add(this.getQxObject("radioFour"));
    row = <div></div>;
    body.add(row);
    row.add(this.getQxObject("switchOne"));
    row.add(this.getQxObject("switchTwo"));

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
        case "checkboxOne":
          return new zx.thin.ui.form.CheckBox("Option One");

        case "checkboxTwo":
          return new zx.thin.ui.form.CheckBox("Option Two");

        case "radioOne":
          return new zx.thin.ui.form.RadioButton("Radio One (Group #1)").set({
            name: "radio-group-one"
          });

        case "radioTwo":
          return new zx.thin.ui.form.RadioButton("Radio Two (Group #1)").set({
            name: "radio-group-one"
          });

        case "radioThree":
          return new zx.thin.ui.form.RadioButton("Radio One (Group #2)").set({
            name: "radio-group-two"
          });

        case "radioFour":
          return new zx.thin.ui.form.RadioButton("Radio Two (Group #2)").set({
            name: "radio-group-two"
          });

        case "switchOne":
          return new zx.thin.ui.form.Switch("Switch One");

        case "switchTwo":
          return new zx.thin.ui.form.Switch("Switch Two");
      }
      return this.base(arguments, id);
    }
  }
});
