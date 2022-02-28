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

qx.Class.define("zx.app.utils.LoginFormDlg", {
  extend: zx.ui.utils.AbstractDialog,

  construct() {
    this.base(arguments, "Login");
    this.setLayout(new qx.ui.layout.VBox());
    this.add(this.getQxObject("edLogin"));
    this.add(this.getQxObject("buttonBar"));
  },

  members: {
    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "btnSubmit":
          var btn = new qx.ui.form.Button(
            "Login",
            "@FontAwesomeSolid/sign-in-alt/16"
          );
          btn.addListener("execute", this._submitDialogClicked, this);
          return btn;

        case "edLogin":
          return new zx.app.utils.LoginForm();
      }

      return this.base(arguments, id);
    },

    /**
     * @Override
     */
    async submitDialog() {
      let ed = this.getQxObject("edLogin");
      let username = ed.getQxObject("edtUsername").getValue().trim();
      let password = ed.getQxObject("edtPassword").getValue().trim();
      if (!username || !password) {
        zx.ui.utils.MessageDlg.showError(
          "Please provide a username and password to login"
        );
        return;
      }

      let loginApi = await qx.core.Init.getApplication()
        .getNetController()
        .getUriMapping("zx.server.auth.LoginApi");
      let result = await loginApi.loginUser(username, password);
      if (!result || result.status != "ok") {
        zx.ui.utils.MessageDlg.showError(
          "Incorrect username or password, please try again"
        );
        return;
      }

      let user = await loginApi.getCurrentUser();
      qx.core.Init.getApplication().setUser(user);
      return this.base(arguments);
    }
  }
});
