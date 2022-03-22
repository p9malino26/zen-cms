qx.Class.define("zx.ui.utils.state.TargetState", {
  extend: qx.core.Object,
  type: "abstract",

  /**
   * Constructor
   *
   * @param {zx.ui.utils.UserState} state where to store detected state
   * @param {qx.core.Object} target the object being tracked
   * @param {Boolean} isDynamic whether the items are dynamic data or static via QxObjectIDs
   */
  construct(state, target, isDynamic) {
    super();
    this.__state = state;
    this.__target = target;
    this.__isDynamic = !!isDynamic;
    this.__listenerIds = [];
  },

  /**
   * Destructor
   */
  destruct() {
    this.__listenerIds.forEach(id => this.__target.removeListenerById(id));
    this.__listenerIds = this.__target = null;
  },

  members: {
    /** @type{zx.ui.utils.UserState} where to read/write state */
    __state: null,

    /** @type{qx.core.Object} the actual target being watched */
    __target: null,

    /** @type{Boolean} whether the values are dynamic or static */
    __isDynamic: false,

    /** @type{Object[]} Array of listeners */
    __listenerIds: null,

    /** @type{Boolean} whether errors have been notified (suppresses future errors) */
    __notified: false,

    /**
     * Loads the state into the controller's selection
     * @abstract
     */
    copyStateToSelection() {
      throw new Error("No such implementation for " + this.classname + ".copyStateToSelection");
    },

    /**
     * Saves the controller's selection into the state
     * @abstract
     */
    copySelectionToState() {
      throw new Error("No such implementation for " + this.classname + ".copySelectionToState");
    },

    /**
     * Adds a listener to the target, tracking the listeners
     *
     * @param {String} eventType the event type name
     * @param {Function} handler the function to call
     * @param {Object?} context the context for `this` (defaults to this `TargetState`)
     */
    _addListenerFor(eventType, handler, context) {
      let id = this.__target.addListener(eventType, handler, context || this);
      this.__listenerIds.push(id);
    },

    /**
     * Adds a listener to the target, tracking the listeners
     *
     * @param {String} eventType the event type name
     * @param {Function} handler the function to call
     * @param {Object?} context the context for `this` (defaults to this `TargetState`)
     */
    _addListenerOnceFor(eventType, handler, context) {
      let id = this.__target.addListenerOnce(eventType, evt => {
        return this.__target && handler.call(context || this, evt);
      });
      this.__listenerIds.push(id);
    },

    /**
     * Gets a value from the state
     *
     * @param {String} key
     * @returns {var?}
     */
    _get(key) {
      return this.getState().getValues().get(key);
    },

    /**
     * Puts a value into state, deletes the existing value if `value` is null or undefined
     *
     * @param {String} key
     * @param {var?} value
     */
    _put(key, value) {
      if (value !== null && value !== undefined) this.getState().getValues().put(key, value);
      else this.getState().getValues().remove(key);
    },

    /**
     * Returns the target
     *
     * @returns {qx.core.Object}
     */
    getTarget() {
      return this.__target;
    },

    /**
     * Returns the ID of the target to be used in state keys; returns null if it is not possible to
     * obtain a reusable ID
     *
     * @returns {String?}
     */
    getTargetId() {
      let target = this.getTarget();
      let id = qx.core.Id.getAbsoluteIdOf(target);
      if (!id) {
        this._notify(`Cannot restore state of ${target.classname} (${target}) because it does not have an ID`);
        return null;
      }
      this._clearNotified();
      return id;
    },

    /**
     * Provides the unique, repeatable ID for an item in the controller's model
     *
     * @param {*} item
     * @returns {String}
     */
    _getIdOfItem(item) {
      if (item === null || item === undefined) return null;

      if (this.__isDynamic) {
        let model = typeof item.getModel == "function" ? item.getModel() : item;
        if (typeof model.toUuid == "function") return model.toUuid();
        if (typeof model._uuid == "string") return model._uuid;
      }

      let valueId = qx.core.Id.getAbsoluteIdOf(item);
      if (valueId) return valueId;

      this._notify(
        `Cannot get ID state of ${this.__target.classname} (${this.__target}) because it's value ${item.classname} (${item})  does not have an ID`
      );
      return null;
    },

    /**
     * Notifies error messages, with suppression for repeated notifications
     *
     * @param {String} msg the message to show
     */
    _notify(msg) {
      if (!this.__notified) {
        this.error(msg);
        this.__notified = true;
      }
    },

    /**
     * Clears the notified flag so that future errors will be reported
     */
    _clearNotified() {
      this.__notified = false;
    },

    /**
     * Returns the UserState
     *
     * @returns {zx.ui.utils.UserState}
     */
    getState() {
      return this.__state;
    },

    /**
     * Whether the items in the widget are dynamic
     *
     * @returns {Boolean}
     */
    isDynamic() {
      return this.__isDynamic;
    }
  }
});
