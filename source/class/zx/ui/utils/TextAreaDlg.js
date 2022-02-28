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

qx.Class.define("zx.ui.utils.TextAreaDlg", {
  extend: zx.ui.utils.AbstractDialog,

  /**
   * Constructor
   */
  construct(message, caption) {
    this.base(arguments, caption || "Information");
    this.setLayout(new qx.ui.layout.VBox(10));
    this.set({ maxWidth: 500, minWidth: 300 });

    let txt = this.getQxObject("txt");
    this.bind("message", txt, "value");
    txt.bind("value", this, "message");
    this.add(txt);
    this.add(this.getQxObject("buttonBar"), { flex: 1 });
    this.setButtons(["ok", "cancel"]);
    if (message) this.setMessage(message);
  },

  properties: {
    /** Whether the text area is read only */
    readOnly: {
      init: false,
      check: "Boolean",
      apply: "_applyReadOnly",
      event: "changeReadOnly"
    },

    /** The message to show in the text area */
    message: {
      init: "",
      nullable: false,
      check: "String",
      apply: "_applyMessage"
    }
  },

  members: {
    /**
     * Apply for `readOnly`
     */
    _applyReadOnly(value) {
      this.getQxObject("txt").setReadOnly(value);
      this.setButtons(value ? ["ok"] : ["ok", "cancel"]);
    },

    /**
     * Apply for `message`
     */
    _applyMessage(value) {
      this.getQxObject("txt").setValue(value);
    },

    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "txt":
          return new qx.ui.form.TextArea();
      }

      return this.base(arguments, id);
    }
  },

  statics: {
    /**
     * Shows the dialog, using a shared instance
     *
     * @param message {String} the value for the text area
     * @param readOnly {Boolean?} whether the text area is read only or not
     */
    showDialog(message, readOnly) {
      var dlg = zx.ui.utils.TextAreaDlg.__instance;
      if (!dlg) {
        dlg = zx.ui.utils.TextAreaDlg.__instance =
          new zx.ui.utils.TextAreaDlg();
        var doc = qx.core.Init.getApplication().getRoot();
        doc.add(dlg);
      }
      dlg.setMessage(message);
      dlg.setReadOnly(readOnly === true);
      return dlg.open();
    }
  }
});
