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


qx.Class.define("zx.test.thin.DemoTextField", {
  extend: zx.thin.ui.container.Window,

  construct() {
    this.base(arguments);
    this.setCaption("Demo Text Input");
    let body = this.getBody();
    body.add(<h2>Demo of the Text input</h2>);
    let row = <div></div>;
    body.add(row);
    row.add(this.getQxObject("textOne"));
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
        case "textOne":
          var txt = new zx.thin.ui.form.TextField("").set({
            label: "Text One",
            helperText: "This is helper text",
            showCharCounter: true,
            leadingIcon: "@FontAwesomeSolid/heart",
            trailingIcon: "@FontAwesomeSolid/heart"
          });
          txt.addListener("changeValue", evt => {
            this.info("Value: " + evt.getData());
          });
          return txt;
      }
      return this.base(arguments, id);
    }
  }
});
