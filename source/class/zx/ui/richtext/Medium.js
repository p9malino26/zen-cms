/**
 * @asset(zx/ui/richtext/medium-editor/*)
 * @ignore(MediumEditor)
 */
qx.Class.define("zx.ui.richtext.Medium", {
  extend: qx.ui.core.Widget,
  implement: [qx.ui.form.IStringForm, qx.ui.form.IForm],
  include: [qx.ui.form.MForm],

  construct: function (initFn) {
    this.base(arguments);
    this.__initFn = initFn;
    zx.utils.ScriptLoader.loadScript(
      ["zx/ui/richtext/medium-editor/js/medium-editor.js"],
      this.__onScriptLoaded,
      this
    ).loadStylesheet([
      "zx/ui/richtext/medium-editor/css/medium-editor.css",
      "zx/ui/richtext/medium-editor/css/themes/beagle.css"
    ]);

    this.__changeValueTimeout = new zx.utils.Timeout(500, () => this.fireDataEvent("changeValue", this.getValue()));

    this.addListenerOnce(
      "appear",
      function () {
        this.__initEditor();
      },
      this
    );

    this.addListener(
      "disappear",
      function (evt) {
        if (this.__editor) {
          this.__editor.getExtensionByName("toolbar").hideToolbar();
          var t = this;
          setTimeout(function () {
            t.__editor.getExtensionByName("toolbar").hideToolbar();
          }, 100);
        }
      },
      this
    );
  },

  events: {
    change: "qx.event.type.Event",
    changeValue: "qx.event.type.Data"
  },

  properties: {
    readOnly: {
      init: false,
      check: "Boolean",
      apply: "_applyReadOnly"
    },

    appearance: {
      init: "textarea",
      refine: true
    },

    // overridden
    selectable: {
      refine: true,
      init: true
    },

    // overridden
    focusable: {
      refine: true,
      init: true
    },

    /**
     * Whether the {@link #changeValue} event should be fired on every
     * key input. If set to true, the changeValue event is equal to the
     * {@link #input} event.
     */
    liveUpdate: {
      check: "Boolean",
      init: false
    }
  },

  members: {
    __pendingValue: null,
    __changeValueTimeout: false,
    __initialised: false,
    __inChangeEvent: false,

    __onScriptLoaded: function (originalUrl, url) {
      this.__scriptsLoaded = true;
      if (this.isDisposed()) return;
      this.__initEditor();
    },

    __initEditor: function () {
      var el = this.getContentElement().getDomElement();
      if (this.__editor || !this.__scriptsLoaded || !el) return;

      el.innerHTML = this.__pendingValue || "<p></p>";
      var opts = {
        toolbar: {
          buttons: [
            "bold",
            "italic",
            "underline",
            "anchor",
            "h1",
            "h2",
            "unorderedlist",
            "orderedlist",
            "justifyLeft",
            "justifyCenter",
            "justifyFull",
            "justifyRight",
            "indent",
            "outdent",
            "quote"
          ]
        },
        cleanPastedHTML: true,
        forcePlainText: false
      };
      if (this.__initFn) opts = this.__initFn(opts);
      var ed = (this.__editor = new MediumEditor(el, opts));
      ed.subscribe("editableInput", this._onNativeInput.bind(this));
      this.__initialised = true;
      if (this.isReadOnly()) {
        el.setAttribute("readOnly", true);
        el.setAttribute("contenteditable", "false");
      }
    },

    _onNativeInput: function (evt) {
      if (this.isReadOnly()) {
        if (typeof evt.preventDefault == "function") evt.preventDefault();
        else if (typeof evt.stopPropagation == "function") evt.stopPropagation();
        return;
      }
      this.fireEvent("change");
      this.__changeValueTimeout.resetTimer();
    },

    /*
     * @Override
     */
    _createContentElement: function () {
      var elOuter = new qx.html.Element("div");
      elOuter.setStyles({
        overflow: "scroll",
        "font-family": "arial",
        "font-size": "12px"
      });
      return elOuter;
    },

    /*
     * @Override
     */
    /*
    _getContentHint: function() {
      var hint = this.base(arguments);

      // two lines of text by default
      hint.height = hint.height * 2;

      // 10 character wide
      hint.width = 16 * 10;

      return hint;
    },
    */

    /*
     * @Override
     */
    /*
    renderLayout: function(left, top, width, height) {
      var result = this.base(arguments, left, top, width, height - 7);
      this._width = width;
      this._height = height;
      this._resizeEditor();
      return result;
    },
    */

    /**
     * Resizes MCE to match the widget
     */
    _resizeEditor: function () {
      /*
      if (this.__editor)
        this.__editor.theme.resizeTo(this._width - 2, this._height - 2);
        */
    },

    /*
     * @Override
     */
    getFocusElement: function () {
      var el = this.getContentElement();
      if (el) {
        return el;
      }
    },

    /*
     * @Override
     */
    _applyEnabled: function (value, oldValue) {
      this.base(arguments, value, oldValue);
    },

    _applyReadOnly: function (value, oldValue) {
      var element = this.getContentElement();

      element.setAttribute("readOnly", value);
      element.setAttribute("contenteditable", value ? "false" : "true");

      if (value) {
        this.addState("readonly");
        this.setFocusable(false);
      } else {
        this.removeState("readonly");
        this.setFocusable(true);
      }
    },

    /**
     * Sets the value of the textfield to the given value.
     *
     * @param value
     *          {String} The new value
     */
    setValue: function (value) {
      if (this.__inChangeEvent) return;
      if (this.__initialised) {
        value = value || "";

        // Remove Surrogate characters
        for (let i = 0; i < value.length; i++) {
          let cp = value.charCodeAt(i);
          if (cp >= 0xd800 && cp <= 0xdbff) {
            // Remove two characters, because they are surrogate
            value = value.substring(0, i) + " " + value.substring(i + 2);
          }
        }

        var el = this.getContentElement().getDomElement();
        var current = el.innerHTML;
        if (current != value) el.innerHTML = value;
      } else this.__pendingValue = value;
    },

    /**
     * Returns the current value of the textfield
     *
     * @return {String|null} The current value
     */
    getValue: function () {
      if (!this.__initialised) return this.__pendingValue;
      var el = this.getContentElement().getDomElement();
      var current = el.innerHTML;
      return current;
    },

    /**
     * Resets the value to the default
     */
    resetValue: function () {
      this.setValue(null);
    }
  }
});
