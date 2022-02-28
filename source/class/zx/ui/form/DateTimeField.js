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

qx.Class.define("zx.ui.form.DateTimeField", {
  extend: qx.ui.core.Widget,
  include: [qx.ui.form.MForm],
  implement: [qx.ui.form.IForm, qx.ui.form.IDateForm],

  construct() {
    this.base(arguments);

    // set the layout
    var layout = new qx.ui.layout.HBox();
    this._setLayout(layout);
    layout.setAlignY("middle");

    // text field
    var textField = this._createChildControl("textfield");
    this._add(textField, { flex: 1 });
    this._add(this.getChildControl("button"));

    // forward the focusin and focusout events to the textfield. The textfield
    // is not focusable so the events need to be forwarded manually.
    this.addListener("focusin", () =>
      textField.fireNonBubblingEvent("focusin", qx.event.type.Focus)
    );
    this.addListener("focusout", () =>
      textField.fireNonBubblingEvent("focusout", qx.event.type.Focus)
    );

    this.setDateTimeFormat(this._createDefaultDateTimeFormat());
    if (qx.core.Environment.get("qx.dynlocale")) {
      this.__localeListenerId = qx.locale.Manager.getInstance().addListener(
        "changeLocale",
        () => this.setDateTimeFormat(this._createDefaultDateTimeFormat())
      );
    }
  },

  properties: {
    /** The value */
    value: {
      init: null,
      nullable: true,
      check: "Date",
      event: "changeValue",
      apply: "_applyValue"
    },

    /** Whether to show the selectboxes for time */
    showTime: {
      init: true,
      check: "Boolean",
      event: "changeShowTime",
      apply: "_applyShowTime"
    },

    /** Whether to show seconds (`showTime` must also be `true`)*/
    showSeconds: {
      init: false,
      check: "Boolean",
      event: "changeShowSeconds",
      apply: "_applyShowSeconds"
    },

    /** The formatter, which converts the selected date to a string. **/
    dateTimeFormat: {
      check: "qx.util.format.DateFormat",
      apply: "_applyDateTimeFormat"
    },

    /**
     * String value which will be shown as a hint if the field is all of:
     * unset, unfocused and enabled. Set to null to not show a placeholder
     * text.
     */
    placeholder: {
      check: "String",
      nullable: true,
      apply: "_applyPlaceholder"
    },

    appearance: {
      refine: true,
      init: "datefield"
    },

    focusable: {
      refine: true,
      init: true
    },

    width: {
      refine: true,
      init: 120
    }
  },

  members: {
    /** @type{*} listener id for locale changes */
    __localeListenerId: null,

    /** @type{Boolean} if we're currently setting the value */
    __inApplyValue: false,

    /**
     * @Override
     */
    _forwardStates: {
      focused: true,
      invalid: true
    },

    /**
     * Apply for `value`
     */
    _applyValue(value, oldValue) {
      this.__inApplyValue = true;

      var textField = this.getChildControl("textfield");
      textField.setValue(this.getDateTimeFormat().format(value));

      // set the date in the datechooser
      this.getChildControl("list").setValue(value);
      this.getChildControl("cboHours").setValue(
        value ? value.getHours() + "" : ""
      );
      this.getChildControl("cboMinutes").setValue(
        value ? value.getMinutes() + "" : ""
      );
      this.getChildControl("edtSeconds").setValue(
        value ? value.getSeconds() + "" : ""
      );

      this.__inApplyValue = false;
    },

    /**
     * Apply for `dateTimeFormat`
     */
    _applyDateTimeFormat(format) {
      let value = this.getValue();
      let textfield = this.getChildControl("textfield");
      if (value && format) textfield.setValue(format.format(value));
      else textfield.setValue("");
    },

    /**
     * Apply for `placeholder`
     */
    _applyPlaceholder(value) {
      this.getChildControl("textfield").setPlaceholder(value);
    },

    /**
     * Apply for `showTime`
     */
    applyShowTime(value) {
      this.getChildControl("compTime").setVisibility(
        value ? "visible" : "excluded"
      );
    },

    /**
     * Apply for `showSeconds`
     */
    _applyShowSeconds(value) {
      this.getChildControl("compSeconds").setVisibility(
        value ? "visible" : "excluded"
      );
    },

    /**
     * Shows the date chooser popup.
     */
    open() {
      let popup = this.getChildControl("popup");

      popup.placeToWidget(this, true);
      popup.show();
    },

    /**
     * Hides the date chooser popup.
     */
    close() {
      this.getChildControl("popup").hide();
    },

    /**
     * Toggles the date chooser popup visibility.
     */
    toggle() {
      let isListOpen = this.getChildControl("popup").isVisible();
      if (isListOpen) this.close();
      else this.open();
    },

    /**
     * @Override
     */
    focus() {
      this.base(arguments);
      this.getChildControl("textfield").getFocusElement().focus();
    },

    /**
     * @Override
     */
    tabFocus() {
      var field = this.getChildControl("textfield");

      field.getFocusElement().focus();
      field.selectAllText();
    },

    /**
     * @Override
     */
    _createChildControlImpl(id, hash) {
      var control;

      switch (id) {
        case "textfield":
          control = new qx.ui.form.TextField();
          control.setFocusable(false);
          control.addState("inner");
          control.addListener(
            "changeValue",
            this._onTextFieldChangeValue,
            this
          );
          return control;

        case "button":
          control = new qx.ui.form.Button();
          control.setFocusable(false);
          control.setKeepActive(true);
          control.addState("inner");
          control.addListener("execute", this.toggle, this);
          return control;

        case "compTime":
          var comp = new qx.ui.container.Composite(new qx.ui.layout.HBox());
          comp.add(new qx.ui.basic.Label("Time : "));
          comp.add(this.getChildControl("cboHours"));
          comp.add(new qx.ui.basic.Label(" : "));
          comp.add(this.getChildControl("cboMinutes"));
          comp.add(this.getChildControl("compSeconds"));
          return comp;

        case "compSeconds":
          var comp = new qx.ui.container.Composite(new qx.ui.layout.HBox()).set(
            { visibility: "excluded" }
          );
          comp.add(new qx.ui.basic.Label(" : "));
          comp.add(this.getChildControl("edtSeconds"));
          return comp;

        case "cboHours":
          var cbo = new qx.ui.form.ComboBox();
          for (var i = 0; i < 24; i++) {
            let str = i < 10 ? "0" + i : "" + i;
            cbo.add(new qx.ui.form.ListItem(str, null, i));
          }
          cbo.addListener("changeValue", this._onTextFieldChangeValue, this);
          return cbo;

        case "cboMinutes":
          var cbo = new qx.ui.form.ComboBox();
          cbo.add(new qx.ui.form.ListItem("00", null, 0));
          cbo.add(new qx.ui.form.ListItem("15", null, 15));
          cbo.add(new qx.ui.form.ListItem("30", null, 30));
          cbo.add(new qx.ui.form.ListItem("45", null, 45));
          cbo.addListener("changeValue", this._onTextFieldChangeValue, this);
          return cbo;

        case "edtSeconds":
          var edt = new qx.ui.form.TextField();
          edt.addListener("changeValue", this._onTextFieldChangeValue, this);
          return edt;

        case "list":
          control = new qx.ui.control.DateChooser();
          control.setFocusable(false);
          control.setKeepFocus(true);
          control.addListener("execute", this._onListChangeDate, this);
          return control;

        case "popup":
          control = new qx.ui.popup.Popup(new qx.ui.layout.VBox());
          control.setAutoHide(false);
          control.add(this.getChildControl("list"));
          control.add(this.getChildControl("compTime"));
          control.addListener("pointerup", this._onListChangeDate, this);
          control.addListener(
            "changeVisibility",
            this._onPopupChangeVisibility,
            this
          );
          return control;
      }

      return this.base(arguments, id);
    },

    /**
     * Parses the text field and handles validation
     */
    _parseTextFieldAndValidateValue() {
      let str = this.getChildControl("textfield").getValue();
      let useTimeFields =
        this.getChildControl("popup").getVisibility() == "visible";

      // This gets the date in the text field as an array of the important parts, eg
      //  "12 March 2021" => [ "12", "March", "2021" ]
      let dateValues = str.match(/\d+|\w+/g) || [];

      // Make a sample date with todays date and any time information
      let sampleDate = new Date();
      this._copyTimeFields(sampleDate);

      // Format the sample date using the dateTimeFormat, and then split it into important parts.
      str = this.getDateTimeFormat().format(sampleDate);
      let sampleValues = [];
      let m = str.match(/\d+|\w+/g);
      if (m) sampleValues = m;
      while (sampleValues.length < 6) sampleValues.push(0);

      // Once split, we replace the sample values with whatever has been written into
      //  the text field; we assume that the order is the same
      for (let i = 0; i < dateValues.length; i++)
        sampleValues[i] = dateValues[i];

      // Get the format string and break it up into the tokens; make sure that the length
      //  of the sampleValues matches
      let formatString = this.getDateTimeFormat().getFormatString();
      let formatTokens = formatString.match(/\w+/g);
      while (formatTokens.length > sampleValues.length) sampleValues.push(0);
      while (formatTokens.length < sampleValues.length)
        qx.lang.Array.removeAt(sampleValues, sampleValues.length - 1);

      // Break the formatString up into format tokens and separators, and then
      //  use that as a guide to reassemble the sampleValues intersperced with the
      //  appropriate separator
      let formatParts = formatString.match(/\W+|\w+/g);
      let sampleValuesIndex = 0;
      let result = formatParts.map((part, index) => {
        if (qx.lang.String.isLetters(part))
          return sampleValues[sampleValuesIndex++];
        return part;
      });
      str = result.join("");

      let value = null;
      try {
        if (str) value = this.getDateTimeFormat().parse(str);

        if (useTimeFields) this._copyTimeFields(value);

        this.set({
          valid: true,
          invalidMessage: null
        });
      } catch (ex) {
        this.set({
          valid: false,
          invalidMessage: ex.toString()
        });
        value = null;
      }
      return value;
    },

    /**
     * Takes the values in the time fields and copies them into the date
     *
     * @param {Date} dt the date field to update
     */
    _copyTimeFields(dt) {
      let tmp;

      tmp = parseInt(this.getChildControl("cboHours").getValue(), 10);
      if (!isNaN(tmp) && tmp >= 0) dt.setHours(tmp);
      tmp = parseInt(this.getChildControl("cboMinutes").getValue(), 10);
      if (!isNaN(tmp) && tmp >= 0) dt.setMinutes(tmp);
      tmp = parseInt(this.getChildControl("edtSeconds").getValue(), 10);
      if (!isNaN(tmp) && tmp >= 0) dt.setSeconds(tmp);
    },

    /**
     * Reacts on value changes of the text field and syncs the
     * value to the combobox.
     *
     * @param e {qx.event.type.Data} Change event
     */
    _onTextFieldChangeValue(e) {
      if (this.__inApplyValue) return;
      let str = this.getChildControl("textfield").getValue();
      let value = this._parseTextFieldAndValidateValue();
      if (!this.isValid()) return;

      this.setValue(value);
    },

    /**
     * Handler method which handles the tap on the calender popup.
     *
     * @param e {qx.event.type.Pointer} The pointer event.
     */
    _onListChangeDate(e) {
      if (this.__inApplyValue) return;
      var selectedDate = this.getChildControl("list").getValue();
      if (!selectedDate) return;
      let value = this.getValue();
      if (!value || !zx.utils.Dates.sameDay(value, selectedDate)) {
        let useTimeFields =
          this.getChildControl("popup").getVisibility() == "visible";
        let dest = new Date(selectedDate.getTime());
        if (useTimeFields) this._copyTimeFields(dest);
        else if (value) zx.utils.Dates.setTimePart(dest, value);
        this.setValue(dest);
      }
      //this.close();
    },

    /**
     * @Override
     */
    async validateField() {
      if (!this.base(arguments)) return false;

      if (this.getChildControl("popup").isVisible())
        this._parseTextFieldAndValidateValue();

      return this.isValid();
    },

    /**
     * Handler for global changes in focus, only fires when the popup is open
     *
     * @param evt {qx.event.type.Focus} The focus event.
     */
    _onGlobalFocus(evt) {
      var next = evt.getTarget();
      if (next.$$qxObject) next = next.$$qxObject;
      if (!(next instanceof qx.ui.core.Widget)) return;
      let popup = this.getChildControl("popup");
      while (next) {
        if (next == popup) return;
        next = next.getLayoutParent();
      }
      let useTimeFields =
        this.getChildControl("popup").getVisibility() == "visible";
      if (useTimeFields) {
        let value = this.getValue();
        if (value) {
          let newValue = new Date(value.getTime());
          this._copyTimeFields(newValue);
          if (value.getTime() != newValue.getTime()) this.setValue(newValue);
        }
      }
      this.close();
    },

    /**
     * Handler method which handles the key press. It forwards all key event
     * to the opened date chooser except the escape key event. Escape closes
     * the popup.
     * If the list is cloned, all key events will not be processed further.
     *
     * @param e {qx.event.type.KeySequence} Keypress event
     */
    _onKeyPress(e) {
      // get the key identifier
      var iden = e.getKeyIdentifier();
      if (iden == "Down" && e.isAltPressed()) {
        this.toggle();
        e.stopPropagation();
        return;
      }

      // if the popup is closed, ignore all
      var popup = this.getChildControl("popup");
      if (popup.getVisibility() == "hidden") return;

      // hide the list always on escape
      if (iden == "Escape") {
        this.close();
        e.stopPropagation();
        return;
      }

      // Stop navigation keys when popup is open
      if (
        iden === "Left" ||
        iden === "Right" ||
        iden === "Down" ||
        iden === "Up"
      )
        e.preventDefault();

      // forward the rest of the events to the date chooser
      this.getChildControl("list").handleKeyPress(e);
    },

    /**
     * Redirects changeVisibility event from the list to this widget.
     *
     * @param e {qx.event.type.Data} Property change event
     */
    _onPopupChangeVisibility(e) {
      const DTF = zx.ui.form.DateTimeField;
      e.getData() == "visible"
        ? this.addState("popupOpen")
        : this.removeState("popupOpen");

      // Synchronize the chooser with the current value on every
      // opening of the popup. This is needed when the value has been
      // modified and not saved yet (e.g. no blur)
      var popup = this.getChildControl("popup");
      if (popup.isVisible()) {
        var chooser = this.getChildControl("list");
        var date = this.getValue();
        chooser.setValue(date);
        DTF.__addActiveField(this);
      } else {
        DTF.__removeActiveField(this);
      }
    },

    /**
     * Called to create an appropriate `qx.util.format.DateFormat`
     *
     * @returns {qx.util.format.DateFormat}
     */
    _createDefaultDateTimeFormat() {
      let format = qx.locale.Date.getDateFormat("medium").toString();
      if (this.isShowTime()) {
        format += " HH:mm";
        if (this.isShowSeconds()) format += ":ss";
      }

      return new qx.util.format.DateFormat(
        format,
        qx.locale.Manager.getInstance().getLocale()
      );
    }
  },

  statics: {
    /** @type{zx.ui.form.DateTimeField[]} array of fields taht currently have their popup open (normally only one) */
    __activeFields: [],

    /**
     * Adds a field to the list that have their popup open
     *
     * @param {zx.ui.form.DateTimeField} field
     */
    __addActiveField(field) {
      const DTF = zx.ui.form.DateTimeField;
      if (qx.core.Environment.get("qx.debug"))
        qx.core.Assert.assertTrue(
          !qx.lang.Array.contains(DTF.__activeFields, field)
        );

      DTF.__activeFields.push(field);
      if (DTF.__activeFields.length == 1)
        qx.event.Manager.addGlobalEventMonitor(DTF.__globalEventMonitor);
    },

    /**
     * Removes a field from the list that have their popup open
     *
     * @param {zx.ui.form.DateTimeField} field
     */
    __removeActiveField(field) {
      const DTF = zx.ui.form.DateTimeField;
      if (qx.core.Environment.get("qx.debug"))
        qx.core.Assert.assertTrue(
          qx.lang.Array.contains(DTF.__activeFields, field)
        );

      qx.lang.Array.remove(DTF.__activeFields, field);
      if (DTF.__activeFields.length == 0)
        qx.event.Manager.removeGlobalEventMonitor(DTF.__globalEventMonitor);
    },

    /**
     * Global event monitor hook, only used when one of the popups are open
     *
     * @param {zx.ui.form.DateTimeField} field
     */
    __globalEventMonitor(target, event) {
      const DTF = zx.ui.form.DateTimeField;
      if (event.getType() == "focus") {
        DTF.__activeFields.forEach(field => field._onGlobalFocus(event));
      }
    }
  }
});
