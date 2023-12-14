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

qx.Class.define("zx.test.app.auth.DemoUsersEditor", {
  extend: zx.app.demo.Demonstrator,

  members: {
    /**
     * @Override
     */
    _createUiRoot() {
      return this.getQxObject("root");
    },

    async initialise() {
      await super.initialise();
    },

    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "root":
          var comp = new qx.ui.container.Composite(new qx.ui.layout.VBox());
          comp.add(this.getQxObject("ed"), { flex: 1 });
          return comp;

        case "ed":
          var ed = new zx.app.auth.UsersEditor();
          ed.getQxObject("edtSearch").setValue("admin");
          return ed;
      }

      return super._createQxObjectImpl(id);
    }
  }
});
