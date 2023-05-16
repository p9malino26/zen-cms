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
     * @param {Boolean} isDynamic whether the items are dynamic data or static via QxObjectIDs
     */
    watch(target, isDynamic) {
      let handlerClass = zx.ui.utils.UserState.getHandlerClass(target.constructor);
      if (!handlerClass) {
        this.error(`Don't know how to watch the state of ${target.classname} (${target})`);
        return null;
      }
      return (this.__targetData[target.toHashCode()] = new handlerClass(this, target, isDynamic));
    },

    /**
     * Un-watches the target
     *
     * @param {qx.core.Object} target
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
    },

    /**
     * Gets a value from the state
     *
     * @param {String} key
     * @returns {var?}
     */
    get(key) {
      return this.getValues().get(key);
    },

    /**
     * Puts a value into state, deletes the existing value if `value` is null or undefined
     *
     * @param {String} key
     * @param {var?} value
     */
    put(key, value) {
      if (value !== null && value !== undefined) {
        this.getValues().put(key, value);
      } else {
        this.getValues().remove(key);
      }
    }
  },

  statics: {
    __instance: null,

    __stateHandlers: {
      classes: {},
      interfaces: {},
      cache: {}
    },

    /**
     * Registers a handler that can record state for a given class
     *
     * @param {Class|Interface} targetClass
     * @param {Class} handlerClass
     */
    registerHander(targetClass, handlerClass) {
      let handlers = zx.ui.utils.UserState.__stateHandlers;
      if (targetClass.$$type == "Interface") {
        handlers.interfaces[targetClass.name] = { targetClass, handlerClass };
      } else {
        handlers.classes[targetClass.classname] = { targetClass, handlerClass };
      }
      handlers.cache = {};
    },

    /**
     * Finds a handler for a given class
     *
     * @param {Class} targetClass
     * @returns {Class}
     */
    getHandlerClass(targetClass) {
      let handlers = zx.ui.utils.UserState.__stateHandlers;
      let clazz = handlers.cache[targetClass.classname];
      if (clazz !== undefined) {
        return clazz;
      }
      for (let info of Object.values(handlers.interfaces)) {
        if (qx.Class.hasInterface(targetClass, info.targetClass)) {
          handlers.cache[targetClass.classname] = info.handlerClass;
          return info.handlerClass;
        }
      }
      for (let info of Object.values(handlers.classes)) {
        if (info.targetClass == targetClass || qx.Class.isSubClassOf(targetClass, info.targetClass)) {
          handlers.cache[targetClass.classname] = info.handlerClass;
          return info.handlerClass;
        }
      }

      return (handlers.cache[targetClass.classname] = null);
    },

    /**
     * Sets the global default instance
     *
     * @param {zx.ui.utils.UserState} instance
     */
    setInstance(instance) {
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertTrue(!instance || !zx.ui.utils.UserState.__instance);
      }
      zx.ui.utils.UserState.__instance = instance;
    },

    /**
     * Returns the global default instance
     *
     * @returns {zx.ui.utils.UserState}
     */
    getInstance() {
      return zx.ui.utils.UserState.__instance;
    },

    /**
     * Watches an object for state changes, there must be a suitable handler registered
     *
     * @param {zx.core.Object} target
     * @param {Boolean} isDynamic whether the items are dynamic data or static via QxObjectIDs
     * @returns
     */
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
      if (!zx.ui.utils.UserState.getInstance()) return null;

      return zx.ui.utils.UserState.getInstance().getStateFor(target);
    }
  },

  defer() {
    zx.ui.utils.UserState.registerHander(qx.ui.core.ISingleSelection, zx.ui.utils.state.WidgetSelectionState);
    zx.ui.utils.UserState.registerHander(qx.data.controller.ISelection, zx.ui.utils.state.ControllerState);
  }
});
