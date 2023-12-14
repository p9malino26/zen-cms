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

qx.Class.define("zx.ui.editor.AutoSave", {
  extend: qx.core.Object,
  type: "singleton",

  construct() {
    super();
    this.__editors = new qx.data.Array();
    this.__timer = new zx.utils.Timeout(1000, this.__onTimeout, this);
    this.__timer.setRecurring(true);
    this.__timer.startTimer();
    qx.core.Init.getApplication().addListener("shutdown", () => {
      this.setEnabled(false);
      this._autoSave();
    });
  },

  properties: {
    /** Whether enabled */
    enabled: {
      init: true,
      nullable: false,
      check: "Boolean",
      apply: "_applyEnabled"
    },

    /**
     * Timeout in milliseconds after user becomes idle before auto saving
     */
    autoSavePeriod: {
      check: "PositiveInteger",
      init: 10000,
      nullable: false,
      event: "changeAutoSavePeriod",
      apply: "_applyAutoSavePeriod"
    }
  },

  events: {
    autoSave: "qx.event.type.Event"
  },

  members: {
    __editors: null,
    __timer: null,
    __lastEventTime: 0,

    _applyEnabled(value, oldValue) {
      if (oldValue) {
        this.__timer.killTimer();
      }
      if (value) {
        this.__timer.startTimer();
      }
    },

    __onTimeout() {
      var uim = zx.ui.utils.UserIdleMonitor.getInstance();
      if (uim.getLastEventTime() != this.__lastEventTime && uim.getIdleTimeElapsed() > this.getAutoSavePeriod()) {
        this._autoSave();
        this.__lastEventTime = uim.getLastEventTime();
      }
    },

    /**
     * Event handler for auto save
     */
    _autoSave() {
      //this.debug("auto-save");
      let masters = {};
      this.__editors.forEach(editor => {
        if (editor.isMasterValueEditor()) {
          masters[editor.toHashCode()] = editor;
        } else {
          let mva = editor.getMasterValueAccessor();
          if (mva) {
            masters[mva.toHashCode()] = mva;
          } else if (qx.core.Environment.get("qx.debug")) {
            this.error(`Cannot auto save ${editor.classname} because it does not have a masterAccessor and is not a master editor`);
          }
        }
      });
      Object.values(masters).forEach(mva => mva.save());
    },

    /**
     * Adds an autosave callback
     */
    add(editor) {
      this.__editors.push(editor);
    },

    /**
     * Removes an autosave callback
     */
    remove(editor) {
      for (var arr = this.__editors, i = 0; i < arr.getLength(); i++) {
        var info = arr.getItem(i);
        if (info === editor) {
          arr.removeAt(i--);
        }
      }
    },

    /**
     * Callback for changes to the autoSavePeriod
     *
     * @param value
     * @param oldValue
     * @returns
     */
    _applyAutoSavePeriod(value, oldValue) {
      this.__timer.setDuration(value);
    }
  }
});
