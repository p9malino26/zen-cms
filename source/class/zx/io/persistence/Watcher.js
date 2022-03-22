const fs = require("fs");

/**
 * Watches objects, only refering to the properties defined by a particular zx.io.persistence.ClassIos,
 * and detects when the object becomes dirty.
 *
 * When a property is an array or map, this also watches the contents of the array or map
 */
qx.Class.define("zx.io.persistence.Watcher", {
  extend: qx.core.Object,

  construct(classIos) {
    super();
    this.__classIos = classIos;
    this.__objectInfoByUuid = {};
    this.__status = {
      numWatchedObjects: 0,
      numDirtyObjects: 0
    };
  },

  events: {
    objectChanged: "qx.event.type.Data",
    propertyChanged: "qx.event.type.Data"
  },

  properties: {
    /** Status will be periodically saved to this file, if provided */
    statusFile: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeStatusFile",
      apply: "_applyStatusFile"
    }
  },

  members: {
    /** @type {zx.io.persistence.ClassIos} */
    __classIos: null,

    /**
     * @typedef {Object} ObjectInfo
     * @property {zx.io.persistence.IObject} object
     * @property {var[]} listenerIds
     * @property {var?} arrayChangeListenerId
     *
     * @type {Map<String,ObjectInfo>} infos for objects, indexed by UUID
     */
    __objectInfoByUuid: null,

    /** @type{var} status information, periodically saved to the `statusFile` */
    __status: null,

    /** @type{zx.utils.Timeout?} the timeout for saving the `statusFile` */
    __statusTimeout: null,

    /**
     * Apply for `statusFile`
     *
     * @param {String} value
     */
    _applyStatusFile(value) {
      if (value) {
        if (!this.__statusTimeout) {
          this.__statusTimeout = new zx.utils.Timeout(1000, this.__onWriteStatusFile, this).set({
            recurring: true
          });
        }
        this.__statusTimeout.setEnabled(true);
      }
      if (!value && this.__statusTimeout) {
        this.__statusTimeout.setEnabled(false);
      }
    },

    /**
     * Called by the timeout to write the status file
     */
    async __onWriteStatusFile() {
      let filename = this.getStatusFile();
      await fs.promises.writeFile(filename, JSON.stringify(this.__status, null, 2), "utf8");
    },

    /**
     * Returns the raw status data that will be serialised.  It's expected that the caller can
     * make arbitrary changes, with the warning that it is serialized with `JSON.stringify` and
     * there is no cleanup or clever serialization semantics.  This class also does not officially
     * document the fields that it adds, so that it can change it's behaviour without warning or
     * concerns over backward compatibility.
     *
     * @returns {var}
     */
    getStatusData() {
      return this.__status;
    },

    /**
     * Called to watch an object for changes, will also watch array and map contents
     *
     * @param {zx.io.persistence.IObject} object
     * @param {...var?} args optional arguments, passed to _attachObject
     */
    watchObject(object, ...args) {
      let uuid = object.toUuid();
      let io = this.__classIos.getClassIo(object.constructor);
      let properties = io.getProperties();
      let info = this.__objectInfoByUuid[uuid];
      if (!info) {
        info = this.__objectInfoByUuid[uuid] = {
          object: object,
          properties: {},
          listenerIds: []
        };
        this.__status.numWatchedObjects++;
        Object.keys(properties).forEach(propertyName => this._watchProperty(info, propertyName));
      }
      this._attachObject(info, ...args);
    },

    /**
     * Unwatches a previously watched object
     *
     * @param {zx.io.persistence.IObject} object
     * @param {...var?} args optional arguments, passed to _attachObject
     */
    unwatchObject(object, ...args) {
      let uuid = object.toUuid();
      let info = this.__objectInfoByUuid[uuid];
      if (!info) return;
      if (this._detachObject(info, ...args)) {
        this.__status.numWatchedObjects--;
        delete this.__objectInfoByUuid[uuid];
        info.listenerIds.forEach(id => object.removeListenerById(id));
      }
    },

    /**
     * Unwatches aall previously watched objects
     *
     * @param {...var?} args optional arguments, passed to _isWatchingImpl
     */
    unwatchAll(...args) {
      Object.keys(this.__objectInfoByUuid).forEach(uuid => {
        let info = this.__objectInfoByUuid[uuid];
        if (this._isWatchingImpl(info, ...args)) {
          if (this._detachObject(info, ...args)) {
            this.__status.numWatchedObjects--;
            delete this.__objectInfoByUuid[uuid];
            info.listenerIds.forEach(id => info.object.removeListenerById(id));
          }
        }
      });
    },

    /**
     * Detects whether an object is being watched
     *
     * @param {zx.io.persistence.IObject} object
     * @param {...var?} args optional arguments, passed to _isWatchingImpl
     */
    isWatching(object, ...args) {
      let uuid = object.toUuid();
      let info = this.__objectInfoByUuid[uuid];
      if (!info) return false;
      return this._isWatchingImpl(info);
    },

    /**
     * Detects whether an object is watched, with the varargs context
     *
     * @param {ObjectInfo} info
     * @param {...var?} args optional arguments, passed to _attachObject
     */
    _isWatchingImpl(info, ...args) {
      return true;
    },

    /**
     * Called when an object is watched
     *
     * @param {ObjectInfo} info
     * @param {...var?} args optional arguments, passed from watchObject
     */
    _attachObject(info, ...args) {
      // Nothing
    },

    /**
     * Called when an object is un-watched
     *
     * @param {ObjectInfo} info
     * @param {...var?} args optional arguments, passed from unwatchObject
     * @returns {Boolean} true if it is OK to stop watching
     */
    _detachObject(info, ...args) {
      return true;
    },

    /**
     * Watches an individual property
     *
     * @param {ObjectInfo} object
     * @param {String} propertyName
     */
    _watchProperty(info, propertyName) {
      let object = info.object;
      let upname = qx.lang.String.firstUp(propertyName);
      let io = this.__classIos.getClassIo(object.constructor);
      let properties = io.getProperties();
      let propertyDef = properties[propertyName];

      if (
        qx.Class.isSubClassOf(propertyDef.check, qx.data.Array) ||
        qx.Class.isSubClassOf(propertyDef.check, zx.data.Map)
      ) {
        const onArrayOrMapChange = evt => {
          let data = evt.getData();
          this._onPropertyChange(object, propertyName);
        };

        const onValueChange = evt => {
          let data = evt.getData();
          let oldData = evt.getOldData();
          if (info.arrayChangeListenerId) {
            oldData.removeListenerById(info.arrayChangeListenerId);
            qx.lang.Array.remove(info.listenerIds, info.arrayChangeListenerId);
            info.arrayChangeListenerId = null;
          }
          if (data) {
            info.arrayChangeListenerId = data.addListener("change", onArrayOrMapChange);
            info.listenerIds.push(info.arrayChangeListenerId);
          }
          this._onPropertyChange(object, propertyName);
        };

        let listenerId = object.addListener("change" + upname, onValueChange);
        info.listenerIds.push(listenerId);
        let arrayOrMap = object["get" + upname]();
        if (arrayOrMap) {
          info.arrayChangeListenerId = arrayOrMap.addListener("change", onArrayOrMapChange);
          info.listenerIds.push(info.arrayChangeListenerId);
        }
      } else {
        let listenerId = object.addListener(
          "change" + qx.lang.String.firstUp(propertyName),
          this.__onSimplePropertyChangeEvent,
          this
        );
        info.listenerIds.push(listenerId);
      }
    },

    /**
     * Event handler for changes to simple properties (ie not arrays or maps)
     *
     * @param {qx.event.type.Data} evt
     */
    __onSimplePropertyChangeEvent(evt) {
      let object = evt.getTarget();
      let eventName = evt.getType();
      if (qx.core.Environment.get("qx.debug")) {
        this.assertTrue(
          eventName.startsWith("change") && eventName.length > 6 && qx.lang.String.isUpperCase(eventName[6])
        );
      }
      let propertyName = qx.lang.String.firstDown(eventName.substring(6));
      return this._onPropertyChange(object, propertyName);
    },

    /**
     * Called to handle a property change
     *
     * @param {zx.io.persistence.IObject} object
     * @param {String} propertyName
     */
    _onPropertyChange(object, propertyName) {
      let uuid = object.toUuid();
      let info = this.__objectInfoByUuid[uuid];
      if (qx.core.Environment.get("qx.debug")) {
        this.assertTrue(!!info);
      }
      this._markObjectChanged(object);

      let io = this.__classIos.getClassIo(object.constructor);
      let propertyDef = io.getProperties()[propertyName];
      this.fireDataEvent("propertyChanged", { object: object, propertyName, propertyDef });
    },

    /**
     * Called to mark an object as dirty
     *
     * @param {zx.io.persistence.IObject} object
     */
    _markObjectChanged(object) {
      let uuid = object.toUuid();
      let info = this.__objectInfoByUuid[uuid];
      if (!info.changed) {
        info.changed = true;
        this.__status.numDirtyObjects++;
        this._onObjectChanged(object);
      }
    },

    /**
     * Called when an object has become dirty
     *
     * @param {zx.io.persistence.IObject} object
     */
    _onObjectChanged(object) {
      this.fireDataEvent("objectChanged", object);
    },

    /**
     * Tests whether an object has changed
     *
     * @param {zx.io.persistence.IObject} object
     * @returns {Boolean}
     */
    isObjectChanged(object) {
      let uuid = object.toUuid();
      let info = this.__objectInfoByUuid[uuid];
      return info && !!info.changed;
    },

    /**
     * Sets (or clears) the dirty flag for the object
     *
     * @param {zx.io.persistence.IObject} object
     * @param {Boolean?} value the new true-ish dirty value
     */
    setObjectChanged(object, value) {
      let uuid = object.toUuid();
      let info = this.__objectInfoByUuid[uuid];
      if (value && !info.changed) {
        this.__status.numDirtyObjects++;
      } else if (!value && info.changed) {
        this.__status.numDirtyObjects--;
      }

      info.changed = !!value;
    },

    /**
     * Returns the ObjectInfo for an object, null if not watched
     *
     * @param {zx.io.persistence.IObject} object
     * @return {ObjectInfo?}
     */
    _getInfoFor(object) {
      let uuid = object.toUuid();
      let info = this.__objectInfoByUuid[uuid];
      return info || null;
    },

    /**
     * @returns {zx.io.persistence.ClassIos}
     */
    getClassIos() {
      return this.__classIos;
    }
  }
});
