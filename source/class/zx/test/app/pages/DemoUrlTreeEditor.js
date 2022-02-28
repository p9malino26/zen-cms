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

qx.Class.define("zx.test.app.pages.DemoUrlTreeEditor", {
  extend: zx.app.demo.Demonstrator,

  members: {
    /**
     * @Override
     */
    _createUiRoot() {
      return this.getQxObject("root");
    },

    async initialise() {
      await this.base(arguments);
      let controller = await qx.core.Init.getApplication().getNetController();
      let config = controller.getUriMapping("zx.server.CmsConfiguration");
      this.getQxObject("ed").setValue(config.getUrlPages());
    },

    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "root":
          var comp = new qx.ui.container.Composite(new qx.ui.layout.VBox());
          comp.add(this.getQxObject("toolbar"));
          comp.add(this.getQxObject("ed"), { flex: 1 });
          return comp;

        case "toolbar":
          var tb = new qx.ui.toolbar.ToolBar();
          tb.add(this.getQxObject("btnSave"));
          return tb;

        case "btnSave":
          var btn = new qx.ui.toolbar.Button("Save");
          btn.addListener("execute", () => {
            this.getQxObject("ed").save();
          });
          return btn;

        case "ed":
          var ed = new zx.app.pages.UrlTreeEditor();
          ed.bind("modified", this.getQxObject("btnSave"), "enabled");
          ed.addListener("changeModified", evt => {
            this.info("Editor detected modified=" + evt.getData());
          });
          return ed;
      }

      return this.base(arguments, id);
    }
  }
});
