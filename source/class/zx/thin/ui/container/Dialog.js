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


qx.Class.define("zx.thin.ui.container.Dialog", {
  extend: zx.thin.ui.container.AbstractWindow,

  construct() {
    this.base(arguments);
    this.initButtonPlacement();
    this.initBodyText();
  },

  properties: {
    /** Refine the main CSS class */
    cssClass: {
      init: "qx-dialog",
      refine: true
    },

    /** How to place buttons, visually */
    buttonPlacement: {
      init: "side-by-side",
      check: ["stacked", "side-by-side"],
      apply: "_applyButtonPlacement"
    },

    /** Default body text */
    bodyText: {
      init: null,
      check: "String",
      apply: "_applyBodyText"
    }
  },

  members: {
    /**
     * Apply for `buttonPlacement`
     */
    _applyButtonPlacement(value, oldValue) {
      if (oldValue) this.removeClass("qx-dialog-button-" + oldValue);
      if (value) this.addClass("qx-dialog-button-" + value);
    },

    /**
     * Apply for `bodyText`
     */
    _applyBodyText(value) {
      let div = this.getQxObject("bodyText");
      if (value) {
        div.setText(value);
        div.show();
      } else {
        div.hide();
      }
    },

    /**
     * Adds a button.  If `caption` is an instance of zx.thin.ui.form.Button then
     * it is used as a button, otherwise a new button is created.
     *
     * So that buttons can be serialised at the server and then picked up again at the client
     * as pre-rendered DOM, the qxObjectId must be assigned.  You can provide your own, unique
     * ID or this function will attempt to generate one based on the caption and icon; this
     * generated ID attempts to be unique and repeatable, but it is not foolproof.
     *
     * @param caption {String|zx.thin.ui.form.Button} the caption or the button
     * @param icon {String?} the icon for the button (ignored unless `caption` is a string)
     * @param qxObjectId {String?} the object ID to assign to the button; if not provided, one
     *  is generated
     * @return {zx.thin.ui.form.Button} the new button
     */
    addButton(caption, icon, qxObjectId) {
      let btn;
      if (caption instanceof zx.thin.ui.form.Button) {
        btn = caption;
      } else {
        btn = new zx.thin.ui.form.Button(caption, icon);
      }
      this.getQxObject("qx.window.footer").add(btn);
      if (!qxObjectId) {
        qxObjectId =
          "__generated__" + caption.toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (icon)
          qxObjectId += "_" + icon.toLowerCase().replace(/[^a-z0-9_]/g, "");
      }
      btn.setQxObjectId(qxObjectId);
      return btn;
    },

    /**
     * @Override
     */
    _createElements() {
      this.add(this.getQxObject("qx.window.caption"));
      let body = this.getQxObject("qx.window.body");
      body.add(this.getQxObject("bodyText"));
      this.add(body);
      this.add(this.getQxObject("qx.window.footer"));
    },

    /**
     * @Override
     */
    _getMoverDragElement() {
      return this.getQxObject("qx.window.caption");
    },

    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "qx.window.footer":
          return <div className="qx-window-footer"></div>;

        case "bodyText":
          return <div></div>;
      }
      return this.base(arguments, id);
    }
  },

  statics: {
    async message(msg) {
      let dlg = new zx.thin.ui.container.Dialog().set({
        centered: "both",
        movable: false
      });
      let btn = dlg.addButton("OK", null, "btnOk");
      btn.addListener("execute", () => dlg.close("ok"));
      dlg.setText(msg);
      return await dlg.open();
    },

    async ask(msg, buttons) {
      let dlg = new zx.thin.ui.container.Dialog().set({
        centered: "both",
        movable: false
      });
      const TYPES = {
        yes: { caption: "Yes" },
        no: { caption: "No" },
        ok: { caption: "OK" },
        cancel: { caption: "Cancel" },
        abort: { caption: "Abort" },
        continue: { caption: "Continue" },
        next: { caption: "Next" },
        prev: { caption: "Previous" }
      };
      buttons.forEach(id => {
        let type = TYPES[id];
        let btn;
        if (!type)
          btn = dlg.addButton(id, null, "btn" + qx.lang.String.firstUp(id));
        else
          btn = dlg.addButton(
            type.caption,
            type.icon || null,
            "btn" + qx.lang.String.firstUp(id)
          );
        btn.setValue(id);
        btn.addListener("execute", () => dlg.close(id));
      });
      dlg.setText(msg);
      return await dlg.open();
    }
  }
});
