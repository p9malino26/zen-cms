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


qx.Class.define("zx.thin.ui.form.TextField", {
  extend: qx.html.Element,

  construct() {
    this.base(arguments);
    var div = <div className="qx-text-input-area"></div>;
    this.add(div);
    div.add(this.getQxObject("leadingIcon"));
    div.add(this.getQxObject("label"));
    div.add(this.getQxObject("input"));
    div.add(this.getQxObject("trailingIcon"));
    div = <div className="qx-text-feedback-area"></div>;
    this.add(div);
    div.add(this.getQxObject("extraText"));
    div.add(this.getQxObject("charCount"));
    this.initHelperText();
    this.initErrorText();
    this.initLabel();
    this.__value = "";
    this.addListener("pointerup", () => this.getQxObject("input").focus());
  },

  properties: {
    /** Refine the main CSS class */
    cssClass: {
      init: "qx-text",
      refine: true
    },

    /** Helper text is displayed below the input, but will be overridden by `errorText` */
    helperText: {
      init: null,
      nullable: true,
      check: "String",
      apply: "_applyHelperText"
    },

    /** Error text is displayed below the input */
    errorText: {
      init: null,
      nullable: true,
      check: "String",
      apply: "_applyErrorText"
    },

    /** Whether to clear the errorText property when input changes */
    autoClearErrorText: {
      init: true,
      check: "Boolean"
    },

    /** Label above the input */
    label: {
      init: "Label",
      check: "String",
      apply: "_applyLabel"
    },

    /** Whether to show the number of characters; if `maxCharacters` is >0 that is displayed also */
    showCharCounter: {
      init: false,
      check: "Boolean",
      apply: "_applyShowCharCounter"
    },

    /** Max number of characters allowed */
    maxCharacters: {
      init: null,
      nullable: true,
      check: "Integer",
      apply: "_applyMaxCharacters"
    },

    /** Leading Icon */
    leadingIcon: {
      init: null,
      nullable: true,
      check: "String",
      apply: "_applyLeadingIcon"
    },

    /** Trailing Icon */
    trailingIcon: {
      init: null,
      nullable: true,
      check: "String",
      apply: "_applyTrailingIcon"
    },

    /** Text value of the input */
    /* psuedo property
    value: {
      init: "",
      nullable: false,
      check: "String",
      event: "changeValue",
      apply: "_applyValue"
    },
    */

    /** Form name of the input */
    name: {
      init: null,
      nullable: true,
      check: "String",
      apply: "_applyName"
    },

    /** Whether this is a password field */
    password: {
      init: false,
      nullable: false,
      check: "Boolean",
      apply: "_applyPassword"
    },

    /** Autocomplete name of the input */
    autoCompleteName: {
      init: null,
      nullable: true,
      check: "String",
      apply: "_applyAutoCompleteName"
    }
  },

  events: {
    changeValue: "qx.event.type.Data"
  },

  members: {
    __value: null,

    /**
     * Setter for "value" psuedo property
     *
     * @param value {String} the value
     */
    setValue(value) {
      if (this.__value !== value) {
        let oldValue = this.__value;
        this.__value = value;
        this._applyValue(value, oldValue);
        this.fireDataEvent("changeValue", value, oldValue);
      }
    },

    /**
     * Getter for "value" psuedo property.
     *
     * This will check with the DOM node to see what the value is - this is necessary because pre-filled
     * form fields by the browser do not reliably trigger the change event on the input when the user
     * interacts with the page, meaning that the value property of TextField is "" when the form on
     * screen shows that it has data
     *
     * @return {String} the value
     */
    getValue(value) {
      if (this.canBeSeen()) {
        let value = this.getQxObject("input")._getProperty("value", true);
        this.setValue(value || "");
      }
      return this.__value;
    },

    /**
     * Apply for "value" property
     */
    _applyValue(value) {
      this.setAttribute("value", value);
      if (!value.length) this.addClass("qx-text-empty");
      else this.removeClass("qx-text-empty");
      if (this.isAutoClearErrorText()) this.setErrorText(null);
    },

    _applyName(value) {
      this.getQxObject("input").setAttribute("name", value);
      this.getQxObject("label").setAttribute("for", value);
    },

    _applyPassword(value) {
      this.getQxObject("input").setAttribute(
        "type",
        value ? "password" : "text"
      );
    },

    _applyAutoCompleteName(value) {
      this.getQxObject("input").setAttribute("autocomplete", value);
    },

    __onInputChange(evt) {
      this.setValue(evt.getTarget().value || "");
    },

    _applyHelperText(value, oldValue) {
      this._updateExtraText();
    },

    _applyErrorText(value, oldValue) {
      this._updateExtraText();
    },

    _updateExtraText() {
      let helperText = this.getHelperText();
      let errorText = this.getErrorText();
      let text = helperText || null;
      if (errorText) text = errorText + "*";
      let widget = this.getQxObject("extraText");
      if (text) {
        this.removeClass("qx-text-helper-text qx-text-error-text");
        this.addClass(errorText ? "qx-text-error-text" : "qx-text-helper-text");
        widget.setText(text);
        widget.show();
      } else {
        widget.hide();
      }
    },

    _applyLabel(value) {
      this.getQxObject("label").setText(value);
    },

    _applyShowCharCounter(value) {
      this.getQxObject("charCount").setVisible(value);
    },

    _applyMaxCharacters(value) {
      this.__updateCharCount();
    },

    _applyLeadingIcon(value) {
      this.getQxObject("leadingIcon").setSource(value);
    },

    _applyTrailingIcon(value) {
      this.getQxObject("trailingIcon").setSource(value);
    },

    __onKeyDown(evt) {
      if (
        evt.altKey ||
        evt.ctrlKey ||
        evt.metaKey ||
        qx.event.util.Keyboard.isNonPrintableKeyCode(evt.keyCode)
      )
        return;
      if (this.isShowCharCounter()) {
        let max = this.getMaxCharacters();
        let value = this.getValue();
        if (max && max >= value.length) {
          evt.preventDefault();
        } else {
          setTimeout(() => this.__updateCharCount(), 1);
        }
      }
    },

    __updateCharCount() {
      let widget = this.getQxObject("charCount");
      let str = this.getValue().length;
      let max = this.getMaxCharacters();
      if (max) str += " / " + max;
      widget.setText(str);
    },

    _createQxObjectImpl(id) {
      switch (id) {
        case "leadingIcon":
          return new zx.thin.ui.basic.Image().addClass("qx-input-leading-icon");

        case "trailingIcon":
          return new zx.thin.ui.basic.Image().addClass(
            "qx-input-trailing-icon"
          );

        case "label":
          return <label></label>;

        case "input":
          var wid = <input></input>;
          wid.addListener("keydown", this.__onKeyDown, this);
          wid.addListener("input", this.__onInputChange, this);
          wid.addListener("focus", () => this.addClass("qx-widget-focus"));
          wid.addListener("blur", () => this.removeClass("qx-widget-focus"));
          return wid;

        case "charCount":
          return <span className="qx-input-charcount"></span>;

        case "extraText":
          return <span className="qx-input-extra-text"></span>;
      }
      return this.base(arguments, id);
    }
  }
});
