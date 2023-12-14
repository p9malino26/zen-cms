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

qx.Class.define("zx.app.utils.LoginForm", {
  extend: zx.ui.editor.FormEditor,

  construct() {
    super();
    this._setLayout(new qx.ui.layout.Grow());
    this._add(this.getQxObject("root"));
  },

  members: {
    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "root":
          var comp = new qx.ui.container.Composite();
          this._addField(comp, "edtUsername", "Username");
          this._addField(comp, "edtPassword", "Password");
          return comp;

        case "edtUsername":
          return new qx.ui.form.TextField();

        case "edtPassword":
          return new qx.ui.form.PasswordField();
      }

      return super._createQxObjectImpl(id);
    }
  }
});
