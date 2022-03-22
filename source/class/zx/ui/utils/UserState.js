/**
 * Manages saving and restoring user interface state into a set of values, which
 * would typically be stored (eg in local storage or on the server)
 */
qx.Class.define("zx.ui.utils.UserState", {
  extend: qx.core.Object,

  /**
   * Constructor
   *
   * @param {zx.data.Map?} values where to store settings
   */
  construct(values) {
    super();
    this.__targetData = {};
    if (values) this.setValues(values);
  },

  properties: {
    /** Map of values to save and restore */
    values: {
      init: null,
      nullable: true,
      check: "zx.data.Map",
      event: "changeValues"
    }
  },

  members: {
    /**
     * @type{Object<String,zx.ui.utils.state.TargetState>} data for each target, indexed by hash code
     */
    __targetData: null,

    /**
     * Starts watching a target for state changes to store, and will initialise the state
     * when the target first appears
     *
     * @param {qx.core.Object} target
     */
    watch(target, isDynamic) {
      if (qx.Interface.classImplements(target.constructor, qx.ui.core.ISingleSelection)) {
        return (this.__targetData[target.toHashCode()] = new zx.ui.utils.state.WidgetSelectionState(
          this,
          target,
          isDynamic
        ));
      }
      if (qx.Interface.classImplements(target.constructor, qx.data.controller.ISelection)) {
        return (this.__targetData[target.toHashCode()] = new zx.ui.utils.state.ControllerState(this, target));
      }
      this.error(`Don't know how to watch the state of ${target.classname} (${target})`);
      return null;
    },

    /**
     * Un-watches the target
     *
     * @param {qx.core.Object} target
     * @returns
     */
    unwatch(target) {
      let data = this.__targetData[target.toHashCode()];
      delete this.__targetData[target.toHashCode()];
      data.dispose();
    },

    /**
     * Locates the state tracker for a specific target
     *
     * @param {qx.core.Object} target
     * @returns {zx.ui.utils.state.TargetState}
     */
    getStateFor(target) {
      return this.__targetData[target.toHashCode()];
    }
  },

  statics: {
    __instance: null,

    setInstance(instance) {
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertTrue(!zx.ui.utils.UserState.__instance);
      }
      zx.ui.utils.UserState.__instance = instance;
    },

    getInstance() {
      return zx.ui.utils.UserState.__instance;
    },

    watch(target, isDynamic) {
      if (!zx.ui.utils.UserState.getInstance()) {
        if (!zx.ui.utils.UserState.__notified) {
          qx.log.Logger.error("No zx.ui.utils.UserState so cannot record state");
          zx.ui.utils.UserState.__notified = true;
        }
        return null;
      }

      return zx.ui.utils.UserState.getInstance().watch(target, isDynamic);
    },

    /**
     * Locates the state tracker for a specific target
     *
     * @param {qx.core.Object} target
     * @returns {zx.ui.utils.state.TargetState}
     */
    getStateFor(target) {
      return zx.ui.utils.UserState.getInstance().getStateFor(target);
    }
  }
});
