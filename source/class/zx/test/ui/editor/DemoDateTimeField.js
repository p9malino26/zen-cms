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

qx.Class.define("zx.test.ui.editor.DemoDateTimeField", {
  extend: zx.app.demo.Demonstrator,

  members: {
    /**
     * @Override
     */
    _createUiRoot() {
      return this.getQxObject("root");
    },

    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "root":
          var comp = new qx.ui.container.Composite(new qx.ui.layout.VBox());
          comp.add(this.getQxObject("df"));
          comp.add(new qx.ui.form.TextArea());
          return comp;

        case "df":
          var df = new zx.ui.form.DateTimeField();
          df.addListener("changeValue", evt => {
            this.log("Changed the date to " + evt.getData());
          });
          return df;
      }

      return this.base(arguments, id);
    }
  }
});
