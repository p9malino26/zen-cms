/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2025 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */

/**
 * @ignore(CodeMirror)
 * @asset(zx/ui/richtext/codemirror/*)
 */
/**
 * Wrapper for CodeMirror Editor
 */
qx.Class.define("zx.ui.richtext.CodeMirror", {
  extend: qx.ui.core.Widget,
  implement: [qx.ui.form.IStringForm, qx.ui.form.IForm],
  include: [qx.ui.form.MForm],

  construct(theme, mode) {
    super();
    this.__features = {};
    this.addListenerOnce("appear", this.__initEditor, this);
    zx.utils.ScriptLoader.loadScript(["zx/ui/richtext/codemirror/lib/codemirror.js"], this.__onScriptLoaded, this).loadStylesheet(["zx/ui/richtext/codemirror/lib/codemirror.css"]);
    if (theme) {
      this.setTheme(theme);
    }
    if (mode) {
      this.setMode(mode);
    }
    this.addListener("appear", this.__onAppear, this);
  },

  events: {
    /** Fired for every change, sinatntly but does not include content */
    change: "qx.event.type.Event",

    /**
     * Fired when the value was modified, but only after the user has
     * paused editing
     */
    changeValue: "qx.event.type.Data"
  },

  properties: {
    /**
     * Editor theme, must be in zx/ui/richtext/codemirror/theme/THEME.css
     */
    theme: {
      check: "String",
      nullable: false,
      init: "default",
      apply: "_applyTheme"
    },

    /**
     * Editor code editing/highlighting mode, must be in
     * zx/ui/richtext/codemirror/theme/MODE/MODE.css
     */
    mode: {
      check: "String",
      nullable: false,
      init: "javascript",
      apply: "_applyMode"
    },

    /**
     * Allows suppression of the changeValue event
     */
    enableChangeEvent: {
      check: "Boolean",
      init: true,
      nullable: false
    }
  },

  members: {
    __editor: null,
    __features: null,

    __inChangeEvent: false,
    __notifyChangeTimer: null,
    __pendingValue: null,

    __scriptsLoaded: false,

    // Last rendered dimensions
    __width: null,
    __height: null,

    /*******************************************************************
     *
     * API METHODS
     *
     */

    /**
     * Sets a "feature" of CodeMirror
     */
    _setFeature(name, value) {
      this.__features[name] = value;
      if (this.__editor) {
        this.__applyFeature(name, value);
      }
    },

    /*******************************************************************
     *
     * PRIVATE METHODS
     *
     */

    /**
     * Applies a feature value to the editor (this.__editor must not be
     * null)
     *
     * @param name
     *          {String} the name of the feature
     * @param value
     *          {Object} the vale to set
     */
    __applyFeature(name, value) {
      var FEATURE = zx.ui.richtext.CodeMirror.__FEATURES[name],
        scripts = null;

      if (!FEATURE) {
        this.__editor.setOption(name, value);
        return;
      }

      if (typeof FEATURE.scripts == "function") {
        scripts = FEATURE.scripts(value);
      } else scripts = FEATURE.scripts;
      if (!scripts) {
        FEATURE.configure(this.__editor, value);
      } else {
        if (!qx.lang.Type.isArray(scripts)) {
          scripts = [scripts];
        }
        zx.utils.ScriptLoader.loadScript(
          scripts,
          function () {
            FEATURE.configure(this.__editor, value);
          },
          this
        );
      }
    },

    /**
     * Returns scripts needed to initialise the editor; this must
     * include the boot script (which should have been loaded async
     * since the constructor was called) plus scripts needed for modes
     * etc.
     *
     * @returns {String[]} a list of URLs to load
     */
    __getInitScripts() {
      var mode = this.getMode();
      var MODE = zx.ui.richtext.CodeMirror.__MODES[mode];
      var scripts;
      if (MODE && MODE.dependsOnScripts) {
        scripts = MODE.dependsOnScripts.slice(0);
      } else {
        scripts = ["zx/ui/richtext/codemirror/mode/" + mode + "/" + mode + ".js"];
      }
      scripts.unshift("zx/ui/richtext/codemirror/lib/codemirror.js");
      return scripts;
    },

    /**
     * Initialises the editor
     */
    __initEditor() {
      if (this.__editor || !this.__scriptsLoaded || !this.getContentElement().getDomElement()) {
        return;
      }

      // Make sure we have all the required init scripts loaded
      var scripts = this.__getInitScripts();
      if (!zx.utils.ScriptLoader.isLoaded(scripts)) {
        zx.utils.ScriptLoader.loadScript(scripts, this.__initEditor, this);
        return;
      }

      var MODE = zx.ui.richtext.CodeMirror.__MODES[this.getMode()];
      var dom = this.getContentElement().getDomElement();
      var config = {
        value: this.__pendingValue || "",
        mode: MODE ? MODE.mode : this.getMode(),
        theme: "default", // this.getTheme(),
        lineNumbers: true
      };

      this.__pendingValue = null;

      // Start the editor
      this.__editor = CodeMirror(dom, config);
      this.__editor.on("change", qx.lang.Function.bind(this.__queueChangeEvent, this));

      // Set any features
      for (var name in this.__features) this.__applyFeature(name, this.__features[name]);

      // resize
      var elems = qx.bom.Selector.query(".CodeMirror-scroll");
      for (var i = 0; i < elems.length; i++) {
        elems[i].style.height = "100%";
        elems[i].style.overflow = "scroll";
      }
      this.__resizeCodeMirror();
    },

    /**
     * Event handler for "appear" - needs to refresh the display in case
     * the value has changed etc
     *
     * @param evt
     */
    __onAppear(evt) {
      if (this.__editor) {
        this.__editor.refresh();
      }
    },

    /**
     * Queues a "changeValue" event until the next blur or a timeout
     */
    __queueChangeEvent() {
      this.fireEvent("change");
      if (this.getEnableChangeEvent() && this.hasListener("changeValue")) {
        var TM = qx.util.TimerManager.getInstance();
        if (this.__notifyChangeTimer != null) {
          TM.stop(this.__notifyChangeTimer);
        }
        this.__notifyChangeTimer = TM.start(this.__flushChangeEvent, 0, this, null, 250);
      }
    },

    /**
     * Sends the changeValue event, if there have been changes
     */
    __flushChangeEvent() {
      if (this.__inChangeEvent) {
        return;
      }
      this.__inChangeEvent = true;
      try {
        this.fireDataEvent("changeValue", this.getValue());
        if (this.hasListener("input")) {
          this.fireDataEvent("input", this.getValue());
        }
        this.__notifyChangeTimer = null;
      } finally {
        this.__inChangeEvent = false;
      }
    },

    __resizeCodeMirror() {
      var el = this.getContentElement();
      if (el) {
        var Style = qx.bom.element.Style;

        var div = el.getDomElement();
        if (div && div.firstChild) {
          div = div.firstChild;
          Style.set(div, "width", this.__width + "px");
          Style.set(div, "height", this.__height + "px");
          this.__editor.refresh();
        }
      }
    },

    /*******************************************************************
     *
     * EVENT HANDLERS
     *
     */

    /**
     * Callback for when the main CodeMirror script has loaded (allows
     * the editor to be initialised)
     *
     * @param originalUrl
     * @param url
     */
    __onScriptLoaded(originalUrl, url) {
      this.__scriptsLoaded = true;
      this.__initEditor();
    },

    /*******************************************************************
     *
     * APPLY METHODS
     *
     */
    _applyEditorOption(value, oldValue, name) {
      this._setFeature(name, value);
    },

    _applyTheme(value, oldValue, name) {
      zx.utils.ScriptLoader.loadStylesheet("zx/ui/richtext/codemirror/theme/" + value + ".css");
      this._applyEditorOption(value, oldValue, name);
    },

    _applyMode(value, oldValue) {
      zx.utils.ScriptLoader.loadScript(
        this.__getInitScripts(),
        function () {
          if (this.__editor) {
            var MODE = zx.ui.richtext.CodeMirror.__MODES[value];
            this.__editor.setOption("mode", MODE ? MODE.mode : value);
          }
        },
        this
      );
    },

    /*******************************************************************
     *
     * OVERRIDDEN/IMPLEMENTED METHODS
     *
     */

    /*
     * @Override - see qx.ui.form.IStringForm
     */
    setValue(value) {
      if (this.__editor) {
        var curr = this.__editor.getValue();
        if (curr == value) {
          return;
        }
        this.__editor.setValue(value);
        this.__editor.refresh();
      } else this.__pendingValue = value;
    },

    /*
     * @Override - see qx.ui.form.IStringForm
     */
    resetValue() {
      this.setValue("");
    },

    /*
     * @Override - see qx.ui.form.IStringForm
     */
    getValue() {
      if (this.__editor) {
        return this.__editor.getValue();
      }
      return this.__pendingValue || "";
    },

    /*
     * @Override
     */
    _createContentElement() {
      var el = new qx.html.Element("div");

      // Apply styles
      el.setStyles({
        padding: 0,
        margin: 0,
        position: "absolute",
        left: "0",
        top: "0"
      });

      el.setAttribute("id", "mycm");
      return el;
    },

    /*
     * @Override
     */
    renderLayout(left, top, width, height) {
      var result = super.renderLayout(left, top, width, height - 7);
      this.__width = width;
      this.__height = height;
      this.__resizeCodeMirror();
      return result;
    }
  },

  statics: {
    __FEATURES: {
      theme: {
        configure(editor, value) {
          if (editor.getOption("theme") != value) {
            zx.utils.ScriptLoader.loadStylesheet("zx/ui/richtext/codemirror/theme/" + value + ".css");
            editor.setOption("theme", value);
          }
        }
      }
    },

    /**
     * Lists special requirements for modes; each entry is a map of:
     * mode {String|Object} the value to set in CM's option, default is
     * the name of the mode dependsOnScripts {String[]} list of scripts
     * to load, default is "zx/ui/richtext/codemirror/MODE/MODE.js"
     */
    __MODES: {
      htmlmixed: {
        mode: "text/html",
        dependsOnScripts: [
          "zx/ui/richtext/codemirror/mode/xml/xml.js",
          "zx/ui/richtext/codemirror/mode/javascript/javascript.js",
          "zx/ui/richtext/codemirror/mode/css/css.js",
          "zx/ui/richtext/codemirror/mode/htmlmixed/htmlmixed.js"
        ]
      },

      htmlembedded: {
        mode: "application/x-ejs",
        dependsOnScripts: [
          "zx/ui/richtext/codemirror/mode/xml/xml.js",
          "zx/ui/richtext/codemirror/mode/javascript/javascript.js",
          "zx/ui/richtext/codemirror/mode/css/css.js",
          "zx/ui/richtext/codemirror/mode/htmlmixed/htmlmixed.js",
          "zx/ui/richtext/codemirror/mode/htmlembedded/htmlembedded.js"
        ]
      }
    }
  }
});
