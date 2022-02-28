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

qx.Class.define("zx.app.auth.ImpersonateDlg", {
  extend: zx.ui.utils.AbstractDialog,

  /**
   * Constructor
   */
  construct(caption) {
    this.base(arguments, caption || "Impersonate");
    this.setLayout(new qx.ui.layout.VBox(10));
    this.set({ maxWidth: 500, minWidth: 300 });

    this.add(this.getQxObject("lblHeader"));
    this.add(this.getQxObject("lblLink"));
    this.add(this.getQxObject("edtLink"));
    this.add(this.getQxObject("buttonBar"), { flex: 1 });
    this.setButtons(["ok"]);
  },

  properties: {
    /** The message to show in the text area */
    link: {
      init: null,
      nullable: true,
      check: "String",
      apply: "_applyLink"
    }
  },

  members: {
    /**
     * Apply for `link`
     */
    _applyLink(value) {
      this.getQxObject("edtLink").setValue(value || "");
      if (value)
        value = `You can click <a href="${value}" target="_blank">this link</a> or copy from the field below`;
      else value = "";
      this.getQxObject("lblLink").setValue(value);
    },

    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "lblHeader":
          return new qx.ui.basic.Label().set({
            rich: true,
            value:
              "To impersonate a user you will need to use a special URL in a browser - " +
              "but the URL will log you out of this browser.<br>\n" +
              "<br>\n" +
              "If you want to stay logged in, you can copy the URL below and paste it in another browser (or use in incognito mode in this browser).<br>\n" +
              "<br>\n" +
              "Note that the URL is only valid for a limited period of time (a few minutes)\n"
          });

        case "edtLink":
          return new qx.ui.form.TextField().set({ readOnly: true });

        case "lblLink":
          return new qx.ui.basic.Label().set({
            rich: true,
            wrap: true,
            allowGrowX: true
          });
      }

      return this.base(arguments, id);
    }
  },

  statics: {
    /**
     * Shows the dialog, using a shared instance
     *
     * @param code {String} the value for the text area
     */
    showDialog(link) {
      var dlg = zx.app.auth.ImpersonateDlg.__instance;
      if (!dlg) {
        dlg = zx.app.auth.ImpersonateDlg.__instance =
          new zx.app.auth.ImpersonateDlg();
        var doc = qx.core.Init.getApplication().getRoot();
        doc.add(dlg);
      }
      dlg.setLink(link);
      return dlg.open();
    }
  }
});
