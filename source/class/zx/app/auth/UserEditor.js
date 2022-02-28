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

qx.Class.define("zx.app.auth.UserEditor", {
  extend: zx.ui.editor.FormEditor,

  construct() {
    this.base(arguments);
    this._setLayout(new qx.ui.layout.VBox());
    this._add(this.getQxObject("grpBasic"));
  },

  members: {
    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "grpBasic":
          var grp = new qx.ui.groupbox.GroupBox("Basic Details");
          this._addField(grp, "edtUsername", "Username", "username");
          this._addField(grp, "edtFullName", "Full Name", "fullName");
          return grp;

        case "edtUsername":
          return new qx.ui.form.TextField().set({ readOnly: true });

        case "edtFullName":
          return new qx.ui.form.TextField().set({ liveUpdate: true });
      }

      return this.base(arguments, id);
    }
  }
});
