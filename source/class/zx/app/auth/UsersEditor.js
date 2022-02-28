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

qx.Class.define("zx.app.auth.UsersEditor", {
  extend: zx.ui.editor.FormEditor,

  construct() {
    this.base(arguments);
    this._setLayout(new qx.ui.layout.VBox());
    this._add(this.getQxObject("toolbar"));
    this._add(this.getQxObject("edtSearch"));
    this._add(this.getQxObject("root"), { flex: 1 });
    this.bind("value", this.getQxObject("ctlr"), "model");
    let ed = this.getQxObject("edUser");
    ed.set({ visibility: "excluded" });
    ed.bind("modified", this, "modified");
    ed.addListener("changeModified", evt => {
      this.info("User editor detected modified=" + evt.getData());
    });
    return ed;
  },

  properties: {
    currentUserJson: {
      init: null,
      nullable: true,
      check: "Object",
      event: "changeCurrentUserJson",
      apply: "_applyCurrentUserJson",
      async: true
    },

    currentUser: {
      init: null,
      nullable: true,
      check: "Object",
      event: "changeCurrentUser",
      apply: "_applyCurrentUser",
      async: true
    }
  },

  members: {
    async _getLoginApiAdmin() {
      let loginApiAdmin = await qx.core.Init.getApplication().getApi(
        "zx.server.auth.LoginApiAdmin"
      );
      return loginApiAdmin;
    },

    /**
     * Apply for `currentUserJson`
     */
    async _applyCurrentUserJson(value) {
      this.getQxObject("ctlr")
        .getSelection()
        .replace(value ? [value] : []);
      let user = null;
      if (value) {
        let loginApiAdmin = await this._getLoginApiAdmin();
        user = await loginApiAdmin.getUserByUuid(value._uuid);
      }
      await this.setCurrentUserAsync(user);
    },

    /**
     * Apply for `currentUser`
     */
    async _applyCurrentUser(value) {
      this.getQxObject("edUser").set({
        value: value,
        visibility: value ? "visible" : "excluded"
      });
      this.getQxObject("mniDelete").setEnabled(!!value);
      this.getQxObject("mniSetPassword").setEnabled(!!value);
      this.getQxObject("mniImpersonate").setEnabled(!!value);
    },

    /**
     * @Override
     */
    async _saveValueImpl() {
      await this.getQxObject("edUser").save();
    },

    /**
     * Does a search for user names
     *
     * @param {String} str the query
     */
    async _search(str) {
      let loginApiAdmin = await this._getLoginApiAdmin();
      let matches = await loginApiAdmin.search(str);
      let lst = this.getQxObject("lst");
      while (lst.getChildren().length) {
        let item = lst.getChildren()[0];
        lst.remove(item);
        item.dispose();
      }
      matches.forEach(info => lst.add(this.__createListItem(info)));
    },

    /**
     * Creates a ListItem from the JSON data returned from the API
     *
     * @param {*} info
     * @returns
     */
    __createListItem(info) {
      let str = info.username;
      if (info.fullName) str += " (" + info.fullName + ")";
      let item = new qx.ui.form.ListItem(str);
      item.setModel(info);
      return item;
    },

    /**
     * Creates an impersonation URl for the user and shows it
     *
     * @param {zx.server.auth.User} user
     */
    async _impersonate(user) {
      let loginApiAdmin = await this._getLoginApiAdmin();
      let result = await loginApiAdmin.createImpersonateCode(user);
      zx.app.auth.ImpersonateDlg.showDialog(
        `${document.location.origin}/zx/impersonate/${result.shortCode}`
      );
    },

    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "toolbar":
          var tb = new qx.ui.toolbar.ToolBar();
          tb.add(this.getQxObject("btnSave"));
          tb.add(this.getQxObject("btnAdd"));
          return tb;

        case "btnSave":
          var btn = new qx.ui.toolbar.Button(
            "Save",
            "@FontAwesomeSolid/save/16"
          );
          btn.addListener("execute", async () =>
            this.getQxObject("edUser").saveValue()
          );
          this.getQxObject("edUser").bind("modified", btn, "enabled");
          return btn;

        case "btnAdd":
          var btn = new qx.ui.form.SplitButton(
            "Add User",
            "@FontAwesomeSolid/user-plus/16",
            this.getQxObject("mnuUserAdmin")
          );
          btn.addListener("execute", async () => {
            let dlg = this.getQxObject("dlgCreateUser");
            dlg.reset();
            let result = await dlg.open();
            if (result == "create") {
              let ed = dlg.getEditor();
              let loginApiAdmin = await this._getLoginApiAdmin();
              let results = await loginApiAdmin.createUser(
                ed.getUsername(),
                ed.getFullName(),
                ed.getPassword()
              );
              let model = this.getQxObject("ctlr").getModel();
              this.getQxObject("lst").add(this.__createListItem(results.user));
              this.setCurrentUserJson(results.user);
            }
          });
          return btn;

        case "mnuUserAdmin":
          var mnu = new qx.ui.menu.Menu();
          mnu.add(this.getQxObject("mniDelete"));
          mnu.add(this.getQxObject("mniImpersonate"));
          mnu.add(this.getQxObject("mniSetPassword"));
          return mnu;

        case "dlgCreateUser":
          return new zx.ui.utils.EditorDialog(
            this.getQxObject("edCreateUser")
          ).set({
            buttons: ["create", "cancel"]
          });

        case "edCreateUser":
          return new zx.app.auth.CreateUserEditor();

        case "mniDelete":
          var btn = new qx.ui.menu.Button(
            "Delete User",
            "@FontAwesomeSolid/user-times/16"
          ).set({ enabled: false });
          btn.addListener("execute", async () => {
            let user = this.getCurrentUser();
            let result = await zx.ui.utils.MessageDlg.showConfirmation(
              `Are you sure that you want to delete ${user.getUsername()}?`
            );
            if (result == "yes") {
              this.setCurrentUserJson(null);
              let loginApiAdmin = await this._getLoginApiAdmin();
              loginApiAdmin.deleteUser(user);
              let model = this.getQxObject("ctlr").getModel();
              model.remove(user);
            }
          });
          return btn;

        case "mniImpersonate":
          var btn = new qx.ui.menu.Button(
            "Impersonate User",
            "@FontAwesomeSolid/ghost/16"
          ).set({ enabled: false });
          btn.addListener("execute", async () =>
            this._impersonate(this.getCurrentUser())
          );
          return btn;

        case "mniSetPassword":
          var btn = new qx.ui.menu.Button(
            "Set Password",
            "@FontAwesomeSolid/key/16"
          ).set({ enabled: false });
          btn.addListener("execute", async () => {
            let dlg = this.getQxObject("dlgSetPassword");
            dlg.reset();
            let result = await dlg.open();
            if (result == "apply") {
              let ed = dlg.getEditor();
              let loginApiAdmin = await this._getLoginApiAdmin();
              await loginApiAdmin.setUserPassword(
                this.getCurrentUser(),
                ed.getPassword()
              );
            }
          });
          return btn;

        case "dlgSetPassword":
          return new zx.ui.utils.EditorDialog(
            this.getQxObject("edSetPassword")
          ).set({
            buttons: ["apply", "cancel"]
          });

        case "edSetPassword":
          return new zx.app.auth.SetPasswordEditor();

        case "edtSearch":
          var edt = new zx.ui.form.SearchField();
          edt.addListener("search", evt => this._search(evt.getData()));
          return edt;

        case "root":
          var comp = new qx.ui.container.Composite(new qx.ui.layout.HBox(2));
          comp.add(this.getQxObject("lst"));
          comp.add(new qx.ui.container.Scroll(this.getQxObject("edUser")), {
            flex: 1
          });
          return comp;

        case "lst":
          return new qx.ui.form.List().set({ minWidth: 300 });

        case "ctlr":
          var ctlr = new qx.data.controller.List(
            null,
            this.getQxObject("lst"),
            "username"
          );
          ctlr.addListener("changeSelection", evt => {
            let sel = ctlr.getSelection();
            let item = sel.getLength() ? sel.getItem(0) : null;
            this.setCurrentUserJson(item);
          });
          return ctlr;

        case "edUser":
          return new zx.app.auth.UserEditor();
      }
    }
  }
});
