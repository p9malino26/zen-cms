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

qx.Class.define("zx.ui.utils.MessageDlg", {
  extend: zx.ui.utils.AbstractDialog,

  /**
   * Constructor
   * @param type? see "type" property, defaults to "information"
   * @param message? {String} the message to display
   * @param caption? {String} the title of the window, defaults to something appropriate for the given type
   * @param buttons? {String[]} the buttons to show, defaults to something appropriate for the given type
   */
  construct(type, message, caption, buttons) {
    this.base(arguments, caption);
    this.setLayout(new qx.ui.layout.VBox(10));
    this.set({
      maxWidth: 500,
      minWidth: 300,
      showClose: false,
      showMinimize: false,
      showMaximize: false,
      showStatusbar: false,
      resizable: false,
      movable: true,
      modal: true
    });

    this.add(this.getQxObject("msgAtom"));

    this.add(this.getQxObject("buttonBar"), { flex: 1 });

    this.setType(type || "information");
    this.setButtons(buttons || ["ok"]);
    if (message) this.setMessage(message);
  },

  properties: {
    type: {
      init: "",
      nullable: false,
      check: ["information", "error", "warning", "confirmation"],
      apply: "_applyType"
    },

    message: {
      init: "",
      nullable: false,
      check: "String",
      apply: "_applyMessage"
    }
  },

  members: {
    /**
     * Apply for `type`
     */
    _applyType(value) {
      let data =
        zx.ui.utils.MessageDlg.TYPES[value] ||
        zx.ui.utils.MessageDlg.TYPES.information;
      this.getQxObject("msgAtom").setIcon(data ? data.icon : null);
    },

    /**
     * Apply for `message`
     */
    _applyMessage(value) {
      this.getQxObject("msgAtom").setLabel(value);
    },

    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "msgAtom":
          return new qx.ui.basic.Atom("").set({ rich: true });
      }

      return this.base(arguments, id);
    }
  },

  statics: {
    TYPES: {
      information: {
        icon: "@FontAwesome/info/32"
      },
      error: {
        icon: "@FontAwesomeSolid/exclamation-circle/32"
      },
      warning: {
        icon: "@FontAwesomeSolid/exclamation-triangle/32"
      },
      confirmation: {
        icon: "@FontAwesomeSolid/question-circle/32"
      }
    },
    _WINDOW: null,

    showError(msg, caption, buttons) {
      return zx.ui.utils.MessageDlg._showDialog(
        "error",
        msg,
        caption || "Error",
        buttons
      );
    },

    showConfirmation(msg, caption, buttons) {
      return zx.ui.utils.MessageDlg._showDialog(
        "confirmation",
        msg,
        caption || "Confirmation",
        buttons || ["yes", "no"]
      );
    },

    showInformation(msg, caption, buttons) {
      return zx.ui.utils.MessageDlg._showDialog(
        "information",
        msg,
        caption || "Information",
        buttons
      );
    },

    showWarning(msg, caption, buttons) {
      return zx.ui.utils.MessageDlg._showDialog(
        "warning",
        msg,
        caption || "Warning",
        buttons || ["ok", "cancel"]
      );
    },

    _showDialog(type, msg, caption, buttons) {
      var dlg = zx.ui.utils.MessageDlg._WINDOW;
      if (!dlg) {
        dlg = zx.ui.utils.MessageDlg._WINDOW = new zx.ui.utils.MessageDlg(type);
        var doc = qx.core.Init.getApplication().getRoot();
        doc.add(dlg);
      } else dlg.setType(type);

      msg = msg.replace(/\n/g, "<br>");
      dlg.setMessage(msg);
      dlg.setCaption(caption || "");
      dlg.setButtons(buttons || ["ok"]);
      return dlg.open();
    }
  }
});
