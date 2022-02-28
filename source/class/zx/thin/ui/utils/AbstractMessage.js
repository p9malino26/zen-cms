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


qx.Class.define("zx.thin.ui.utils.AbstractMessage", {
  extend: zx.thin.ui.container.Window,

  construct(message, caption, buttons) {
    this.base(arguments);
    if (message) this.setMessage(message);
    if (caption) this.setCaption(caption);
    this.setButtons(buttons || ["yes", "no"]);
    let body = this.getBody();
    body.add(this.getQxObject("message"));
    body.add(this.getQxObject("buttonBar"));
    this.setCentered("both");
  },

  properties: {
    /** Message to place across the popup */
    message: {
      check: "String",
      apply: "_applyMessage"
    },

    /** Buttons */
    buttons: {
      init: ["yes", "no"],
      check: "Array",
      apply: "_applyButtons"
    },

    /** Refine the main CSS class */
    cssClass: {
      init: "qx-utils-message",
      refine: true
    },

    /** Refine as non inline */
    inline: {
      init: false,
      refine: true
    },

    /** Refine as modal */
    modal: {
      init: true,
      refine: true
    }
  },

  members: {
    _applyMessage(value) {
      this.getQxObject("message").setText(value);
    },

    _applyButtons(value) {
      let bar = this.getQxObject("buttonBar");
      let arr = bar.getChildren();
      if (arr) {
        qx.lang.Array.clone(arr).forEach(child => {
          bar.remove(child);
          child.dispose();
        });
      }
      const AbstractMessage = zx.thin.ui.utils.AbstractMessage;
      value.forEach(type => {
        let btn = new zx.thin.ui.form.Button(
          AbstractMessage.TYPES[type].caption
        ).set({ style: "contained" });
        btn.addListener("execute", () => this.close(type));
        bar.add(btn);
      });
    },

    _createQxObjectImpl(id) {
      switch (id) {
        case "message":
          return <p>Your Message</p>;

        case "buttonBar":
          return <div></div>;
      }
      return this.base(arguments, id);
    }
  },

  statics: {
    TYPES: {
      ok: {
        caption: "OK"
      },
      yes: {
        caption: "Yes"
      },
      no: {
        caption: "No"
      },
      apply: {
        caption: "Apply"
      },
      cancel: {
        caption: "Cancel"
      }
    }
  }
});
