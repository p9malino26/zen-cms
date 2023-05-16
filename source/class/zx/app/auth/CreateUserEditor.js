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

qx.Class.define("zx.app.auth.CreateUserEditor", {
  extend: zx.ui.editor.FormEditor,
  include: [qx.ui.core.MChildrenHandling, qx.ui.core.MLayoutHandling],

  construct() {
    this.base(arguments);
    this._addField(this, "edtUsername", "Username", "username");
    this._addField(this, "edtFullName", "Full Name", "fullName");
    this._addField(this, "edtPassword", "Password");
    this._addField(this, "edtConfirmPassword", "Confirm Password");
  },

  members: {
    getUsername() {
      return this.getQxObject("edtUsername").getValue();
    },

    getFullName() {
      return this.getQxObject("edtFullName").getValue();
    },

    getPassword() {
      return this.getQxObject("edtPassword").getValue();
    },

    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "edtUsername":
          return new qx.ui.form.TextField().set({ required: true });

        case "edtFullName":
          return new qx.ui.form.TextField();

        case "edtPassword":
          return new qx.ui.form.PasswordField().set({
            required: true,
            liveUpdate: true
          });

        case "edtConfirmPassword":
          return new qx.ui.form.PasswordField().set({
            required: true,
            liveUpdate: true,
            validator: () => {
              let password = this.getQxObject("edtPassword").getValue().trim();
              let confirmPassword = this.getQxObject("edtConfirmPassword")
                .getValue()
                .trim();
              if (password == confirmPassword) return null;
              return "Both passwords must match exactly";
            }
          });
      }

      return this.base(arguments, id);
    }
  }
});
