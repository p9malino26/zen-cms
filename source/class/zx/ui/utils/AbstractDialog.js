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

qx.Class.define("zx.ui.utils.AbstractDialog", {
  extend: qx.ui.window.Window,
  type: "abstract",

  construct(caption) {
    super(caption || "");
    this.__buttons = {};
    this.set({
      minWidth: 350,
      showClose: false,
      showMinimize: false,
      showMaximize: false,
      showStatusbar: false,
      resizable: false,
      movable: true,
      modal: true,
      trapKeyboard: true
    });

    this.center();
    this.addListenerOnce("appear", () => {
      this.center();
      this.getLayoutParent().addListener("resize", () => this.center());
    });
    this.addListener("close", this._onClose, this);
  },

  events: {
    /** Fired when the button is pressed, data is the button code.  Cancel this even to prevent the default action */
    buttonPress: "qx.event.type.Data",

    /** Fired when the dialog is submitted, data is the button code.  Can be cancelled */
    submit: "qx.event.type.Event",

    /** Fired when the dialog is submitted, data is the button code.  Can be cancelled, but cancelling will not work in all circumstances */
    cancel: "qx.event.type.Event"
  },

  properties: {
    /** Arbitrary value */
    value: {
      init: null,
      nullable: true,
      apply: "_applyValue",
      event: "changeValue"
    },

    /** List of buttons */
    buttons: {
      init: ["ok", "cancel"],
      nullable: false,
      apply: "_applyButtons",
      event: "changeButtons"
    },

    /** Whether to trap the keyboard, looking for Enter and Esc as shortcuts to submit and cancel */
    trapKeyboard: {
      nullable: false,
      check: "Boolean",
      apply: "_applyTrapKeyboard",
      event: "changeTrapKeyboard"
    }
  },

  members: {
    /** @type {Map<String, ButtonType} button types, if the defaults are not being used */
    __buttonTypes: null,

    /** @type {Map<String, qx.ui.core.Widget>} buttons, indexed by type ID */
    __buttons: null,

    /** @type{Boolean} true if the dialog has been opened at least once */
    __opened: false,

    /** @type{*} Listener ID for keypress */
    __keyPressListenerId: null,

    /** @type{qx.Promsie?} the promise that will resolve when the dialog is closed */
    __onClosePromise: null,

    /**
     * Apply for `trapKeyboard`
     */
    _applyTrapKeyboard(value, oldValue) {
      if (oldValue) {
        this.removeListenerById(this.__keyPressListenerId);
        this.__keyPressListenerId = null;
      }

      if (value) {
        this.__keyPressListenerId = this.addListener(
          "keypress",
          function (evt) {
            var key = evt.getKeyIdentifier();
            if (key == "Enter") {
              this._onEnterPressed(evt);
            } else if (key == "Escape") {
              this._onEscapePressed(evt);
            }
          },
          this,
          true
        );
      }
    },

    /**
     * Changes to "value" property
     *
     * @param value
     * @param oldValue
     * @returns
     */
    _applyValue(value, oldValue) {
      // Nothing
    },

    /**
     * Callback for when the enter key is pressed
     */
    _onEnterPressed() {
      if (this.__opened) {
        var focused = qx.ui.core.FocusHandler.getInstance().getFocusedWidget();
        if (!(focused instanceof qx.ui.form.TextArea)) {
          this.submitDialog();
        }
      }
    },

    /**
     * Callback for when the escape key is pressed
     */
    _onEscapePressed() {
      if (this.__opened) {
        var focused = qx.ui.core.FocusHandler.getInstance().getFocusedWidget();
        if (!(focused instanceof qx.ui.form.TextArea)) {
          this.cancelDialog();
        }
      }
    },

    /**
     * Opens the dialog
     * @return {String} either "submit" or "cancel"
     */
    async open() {
      if (this.__onClosePromise) {
        throw new Error("Cannot open the dialog multiple times");
      }
      this.__opened = true;
      let promise = (this.__onClosePromise = new qx.Promise());
      super.open();
      this._onOpened();
      return await promise;
    },

    /**
     * Called when the dialog is just opened
     */
    _onOpened() {
      // Nothing
    },

    /**
     * Event handler for when the window closes
     */
    _onClose() {
      this.__opened = false;
      let promise = this.__onClosePromise;
      if (promise) {
        this.__onClosePromise = null;
        promise.resolve(null);
      }
    },

    /**
     * Callback for when the dialog is Submitted
     *
     * @param {String} buttonCode the button that caused this to fire
     * @return {Boolean} true if submitted, false if submit was cancelled
     */
    async submitDialog(buttonCode) {
      if (!buttonCode) {
        for (let arr = this.getButtons(), i = 0; i < arr.length && !buttonCode; i++) {
          let type = this._getButtonType(arr[i]);
          if (type.kind == "submit") {
            buttonCode = arr[i];
          }
        }
      }
      buttonCode = buttonCode || "submit";
      if (!this.fireDataEvent("submit", buttonCode, null, true)) {
        return false;
      }
      await this._resolve(buttonCode);
      return true;
    },

    /**
     * Callback for when the dialog is cancelled
     *
     * @param {String?} buttonCode the button that caused this to fire, can be null
     * @return {Boolean} true if cancelled, false if cancel was cancelled
     */
    async cancelDialog(buttonCode) {
      buttonCode = buttonCode || "cancel";
      if (!this.fireDataEvent("cancel", buttonCode, null, true)) {
        return false;
      }
      await this._resolve(buttonCode);
      return true;
    },

    /**
     * Called to resolve the promise etc
     * @param {*} value
     */
    async _resolve(value) {
      let promise = this.__onClosePromise;
      if (!promise) {
        throw new Error("Cannot resolve the dialog more than once per time it is opened");
      }
      this.__onClosePromise = null;
      this.close();
      await promise.resolve(value);
    },

    /**
     * Apply for `buttons`
     */
    _applyButtons(value, oldValue) {
      let buttonBar = this.getQxObject("buttonBar");
      if (oldValue) {
        oldValue.forEach(code => {
          let button = this.__buttons[code];
          if (button) {
            buttonBar.remove(button);
          }
        });
      }

      if (value) {
        value.forEach(code => {
          let button = this.getDialogButton(code);
          buttonBar.add(button);
        });
      }
    },

    /**
     * Gets the button for a given button code, caching the result
     *
     * @param {String} code
     * @returns {qx.ui.core.Widget} the button
     */
    getDialogButton(code) {
      let button = this.__buttons[code];
      if (!button) {
        button = this.__buttons[code] = this._createDialogButton(code);
      }
      return button;
    },

    /**
     * Called to create a button
     *
     * @param {String} code the short code of the button, one of the values in `buttons` property
     * @return {qx.ui.core.Widget} the button
     */
    _createDialogButton(code) {
      let data = this._getButtonType(code);
      let button = new qx.ui.form.Button(data.caption, data.icon);
      button.addListener("execute", this._onDialogButtonClick.bind(this, code));
      return button;
    },

    /**
     * Returns the button type for the code
     *
     * @param {String} code
     * @returns {ButtonType}
     */
    _getButtonType(code) {
      let data = (this.__buttonTypes || zx.ui.utils.AbstractDialog.DEFAULT_BUTTON_TYPES)[code];
      if (!data) {
        throw new Error(`Unrecognised code for button: ${code}`);
      }
      return data;
    },

    /**
     * Adds a custom button
     *
     * @param {String} code the short code to use
     * @param {ButtonType} map the map of button properties
     */
    addCustomButtonType(code, map) {
      if (this.__buttonTypes === null) {
        this.__buttonTypes = {};
        for (let key in zx.ui.utils.AbstractDialog.DEFAULT_BUTTON_TYPES) this.__buttonTypes[key] = zx.ui.utils.AbstractDialog.DEFAULT_BUTTON_TYPES[key];
      }
      this.__buttonTypes[code] = map;
    },

    /**
     * Event handler for when the button is clicked.  If you want to handle the button,
     * you might want to override `_handleDialogButtonClick` instead
     *
     * @param {*} evt
     */
    _onDialogButtonClick(code, evt) {
      let button = evt.getTarget();
      if (!this.fireDataEvent("buttonPress", code)) {
        return;
      }
      this._handleDialogButtonClick(button, code);
    },

    /**
     * Called to handle the click, simplified version of the event handler
     *
     * @param {qx.ui.core.Widget} button the button
     * @param {String} code the code for the button
     */
    _handleDialogButtonClick(button, code) {
      let data = this._getButtonType(code);
      if (data.kind == "submit") {
        this.submitDialog(code);
      } else if (data.kind === "cancel") {
        this.cancelDialog(code);
      }
    },

    /*
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "buttonBar":
          var comp = new qx.ui.container.Composite(new qx.ui.layout.HBox(5, "right"));
          var codes = this.getButtons();
          codes.forEach(code => {
            let button = this.getDialogButton(code);
            comp.add(button);
          });
          return comp;
      }
    }
  },

  statics: {
    /*
     * @typedef ButtonType
     * @property {String} caption the caption
     * @property {String?} icon the icon
     * @property {String?} kind either: "submit", "cancel", or "none" (the default)
     */
    DEFAULT_BUTTON_TYPES: {
      ok: {
        caption: "OK",
        icon: "@FontAwesomeSolid/check-circle/16",
        kind: "submit"
      },

      yes: {
        caption: "Yes",
        icon: "@FontAwesomeSolid/check-circle/16",
        kind: "submit"
      },

      apply: {
        caption: "Apply",
        icon: "@FontAwesomeSolid/check-circle/16",
        kind: "submit"
      },

      create: {
        caption: "Create",
        icon: "@FontAwesomeSolid/plus-circle/16",
        kind: "submit"
      },

      no: {
        caption: "No",
        icon: "@FontAwesomeSolid/times-circle/16",
        kind: "cancel"
      },

      cancel: {
        caption: "Cancel",
        icon: "@FontAwesomeSolid/times-circle/16",
        kind: "cancel"
      },

      delete: {
        caption: "Delete",
        icon: "@FontAwesomeSolid/minus-circle/16",
        kind: "cancel"
      },

      upload: {
        caption: "Upload",
        icon: "@FontAwesomeSolid/cloud-arrow-up/16",
        kind: "ok"
      }
    }
  }
});
