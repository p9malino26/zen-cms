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

qx.Class.define("zx.test.ui.editor.DemoEditor", {
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
          comp.add(this.getQxObject("toolbar"));
          comp.add(this.getQxObject("edPeople"), { flex: 1 });
          return comp;

        case "toolbar":
          var tb = new qx.ui.toolbar.ToolBar();
          tb.add(this.getQxObject("btnSave"));
          return tb;

        case "btnSave":
          var btn = new qx.ui.toolbar.Button("Save");
          btn.addListener("execute", () => {
            this.info("Saved via PeopleEditor");
            this.getQxObject("edPeople").save();
          });
          return btn;

        case "edPeople":
          var ed = new zx.test.ui.editor.PeopleEditor();
          ed.bind("modified", this.getQxObject("btnSave"), "enabled");
          ed.addListener("changeModified", evt => {
            this.info("People editor detected modified=" + evt.getData());
          });
          ed.setValue(new qx.data.Array());
          return ed;
      }

      return super._createQxObjectImpl(id);
    }
  }
});
