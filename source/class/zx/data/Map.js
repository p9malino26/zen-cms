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


/**
 * Implementation of Map, which is a set of key:value pairs with event handlers
 * for changes to the keys, values, and the entries (where an "entry" is a key/value
 * pair); this class is to <code>{}</code> as <code>qx.data.Array</code> is to
 * <code>[]</code>
 *
 * By default, the keys are stored in a native object which means that only native
 * types which can be converted to a String can be used as keys; however, by
 * specifying the `keysAreHashed` parameter to the constructor, the class will
 * require that all keys are instance of <code>qx.core.Object</code> and will
 * use the object's hash code.
 *
 * This has a side effect when importing and exporting the Map into an external
 * form, via the <code>replace()</code> and <code>toObject()</code> methods; Maps
 * which have <code>keysAreHashed===true</code> are imported and exported as an array of
 * native objects with key & value properties.
 *
 * @see zx.data.Entry
 */
qx.Class.define("zx.data.Map", {
  extend: qx.core.Object,

  /**
   * Constructor.
   * @param values {Object?} values to import
   * @param keysAreHashed {Boolean?} whether keys are objects and according to their hash
   */
  construct(values, keysAreHashed, keyClass, valueClass) {
    this.base(arguments);
    var args = qx.lang.Array.fromArguments(arguments);
    if (typeof args[0] == "boolean") args.unshift(undefined);
    values = args.shift();
    keysAreHashed = args.shift();
    keyClass = args.shift();
    valueClass = args.shift();

    this.__keysAreHashed = keysAreHashed;
    this.__lookupEntries = {};
    this.set({
      keys: new qx.data.Array(),
      values: new qx.data.Array(),
      entries: new qx.data.Array()
    });
    if (keyClass !== undefined) this.setKeyClass(keyClass);
    if (valueClass !== undefined) this.setValueClass(valueClass);
    if (values !== undefined) {
      this.replace(values);
    }
  },

  events: {
    /**
     * @typedef {Object} PutElement
     * @property {String} key the key being added
     * @property {var} value the value being added
     * @property {var?} oldValue the value being replaced, undefined if being added
     * @property {qx.data.Entry} entry the entry being added
     *
     * @typedef {Object} RemovedElement
     * @property {String} key the key being removed
     * @property {var} value the value being removed
     * @property {var} oldValue the value being removed
     * @property {qx.data.Entry} entry the entry being removed
     *
     * @typedef {Object} ChangeEventData
     * @property {String} type one of "put", "remove", "put/remove", "order"
     * @property {PutElement[]} put values which had been put
     * @property {RemovedElement[]} removed values which had been removed
     *
     * Fired when the map changes, data is {ChangeEventData}
     */
    change: "qx.event.type.Data"
  },

  properties: {
    /**
     * List of all keys in the map, should never be set explicitly
     */
    keys: {
      nullable: false,
      check: "qx.data.Array",
      event: "changeValues",
      apply: "_applyKeys"
    },

    /**
     * List of all values in the map, should never be set explicitly
     */
    values: {
      nullable: false,
      check: "qx.data.Array",
      event: "changeValues",
      apply: "_applyValues"
    },

    /** List of all Entry's in the map */
    entries: {
      nullable: false,
      check: "qx.data.Array",
      event: "changeEntries",
      apply: "_applyEntries"
    },

    /** Class of keys (ignored for native key types) */
    keyClass: {
      nullable: true,
      init: null,
      check: "Class",
      transform: "_transformToClass"
    },

    /** Class of values */
    valueClass: {
      nullable: true,
      init: null,
      check: "Class",
      transform: "_transformToClass"
    }
  },

  members: {
    // Implementation of the map
    __lookupEntries: null,

    // Whether keys are objects and the hashcode is stored (as opposed to native values, ie string)
    __keysAreHashed: false,

    // Anti recursion mutex
    __changingValue: false,

    /**
     * Gets a value from the map
     *
     * @param key
     *          {String} the key to lookup
     * @returns {Object?} the object that was found, or undefined
     */
    get(key) {
      var id = this.__getKey(key);
      var entry = this.__lookupEntries[id];
      return entry ? entry.getValue() : undefined;
    },

    /**
     * Gets an entry from the map
     *
     * @param key
     *          {String} the key to lookup
     * @returns {Entry?} the entry that was found, or null
     */
    getEntry(key) {
      var id = this.__getKey(key);
      return this.__lookupEntries[id] || null;
    },

    /**
     * Puts a new value in the map
     *
     * @param {var} key the key to assign
     * @param {var?} value the object to set for the key, if undefined the key is removed
     * @returns {var?} the previous object for the key, or undefined
     */
    put(key, value) {
      if (value === undefined) {
        return this.remove(key);
      }

      var data = this.__putImpl(key, value);

      this.fireDataEvent("change", {
        type: "put",
        put: [data]
      });
      return data.oldValue;
    },

    /**
     * Helper method to get a value from the map
     * @param {var} key
     * @returns {var?} the value
     */
    __getKey(key) {
      if (this.__keysAreHashed) {
        if (key === null || key === undefined) throw new Error("Invalid key passed to Map.__getKey");
        var hash = qx.core.ObjectRegistry.toHashCode(key);
        return hash;
      }
      return key;
    },

    /**
     * Internal implementation of put
     *
     * @param key {var} the key
     * @param value {var} the object
     * @return {PutElement}
     */
    __putImpl: function (key, value) {
      var keyClass = this.getKeyClass();
      var valueClass = this.getValueClass();
      if (keyClass && !(key instanceof keyClass))
        throw new Error(
          "Cannot put key into map because key is the wrong class, expected " + keyClass + ", given key=" + key
        );
      if (valueClass && !(value instanceof valueClass))
        throw new Error(
          "Cannot put value into map because value is the wrong class, expected " +
            valueClass +
            ", given value=" +
            value
        );
      qx.core.Assert.assertFalse(this.__changingValue);
      this.__changingValue = true;
      try {
        var values = this.getValues();
        var keys = this.getKeys();
        var entries = this.getEntries();
        var id = this.__getKey(key);

        var entry = this.__lookupEntries[id];
        var oldValue = null;
        var result;

        if (entry) {
          oldValue = entry.getValue();
          values.remove(oldValue);
          entry.setValue(value);
          if (!values.contains(value)) values.push(value);
          result = {
            key: key,
            value: value,
            entry: entry,
            oldValue: oldValue
          };
        } else {
          entry = new zx.data.Entry(key, value);
          this.__attachEntry(entry);
          if (!values.contains(value)) values.push(value);
          if (!keys.contains(key)) keys.push(key);
          result = {
            key: key,
            value: value,
            entry: entry
          };
        }

        return result;
      } finally {
        this.__changingValue = false;
      }
    },

    /**
     * Attaches an entry
     *
     * @param {zx.data.Entry} entry entry to add
     */
    __attachEntry(entry) {
      entry.addListener("changeValue", this.__onEntryChangeValue, this);
      this.getEntries().push(entry);
      var id = this.__getKey(entry.getKey());
      this.__lookupEntries[id] = entry;
    },

    /**
     * Detaches an entry
     *
     * @param {zx.data.Entry} entry entry to remove
     */
    __detachEntry(entry) {
      entry.removeListener("changeValue", this.__onEntryChangeValue, this);
      this.getEntries().remove(entry);
      var id = this.__getKey(entry.getKey());
      delete this.__lookupEntries[id];
    },

    /**
     * Event handler for changes to an entry's value property
     *
     * @param evt {qx.event.type.Data}
     */
    __onEntryChangeValue(evt) {
      if (this.__changingValue) return;
      var entry = evt.getTarget();
      var value = entry.getValue();
      var oldValue = evt.getOldData();
      var remove = true;
      for (var id in this.__lookupEntries) {
        if (this.__lookupEntries[id].getValue() === oldValue) {
          remove = false;
          break;
        }
      }
      var values = this.getValues();
      if (remove) values.remove(oldValue);
      if (!values.contains(value)) values.push(value);

      this.fireDataEvent("change", {
        type: "put",
        put: [
          {
            key: entry.getKey(),
            value: entry.getValue(),
            oldValue: oldValue,
            entry: entry
          }
        ]
      });
    },

    /**
     * Replaces all of the elements in this map with another, firing only one "change" event
     * for "put" and/or "remove"
     *
     * @param {zx.data.Map|Object} src the map or object to copy from
     */
    replace(src) {
      var t = this;
      if (src instanceof zx.data.Map) src = src.toObject();

      var values = this.getValues();
      var keys = this.getKeys();
      var entries = this.getEntries();

      var removed = [];
      var put = [];

      var srcEntries = {};
      if (this.__keysAreHashed) {
        src.forEach(function (entry) {
          var id = t.__getKey(entry.key);
          srcEntries[id] = entry;
        });
      } else if (qx.lang.Type.isArray(src)) {
        src.forEach(function (entry) {
          var id = entry.key;
          srcEntries[id] = entry;
        });
      } else {
        for (var name in src) {
          srcEntries[name] = { key: name, value: src[name] };
        }
      }

      for (var id in this.__lookupEntries) {
        if (srcEntries[id] === undefined) {
          var tmp = this.__lookupEntries[id];
          removed.push({
            key: tmp.getKey(),
            value: tmp.getValue(),
            entry: tmp
          });
          values.remove(tmp.getValue());
          keys.remove(id);
          this.__detachEntry(tmp);
        }
      }

      for (var id in srcEntries) {
        var entry = srcEntries[id];
        put.push(this.__putImpl(entry.key, entry.value));
      }

      let eventData = {};
      if (Object.keys(removed).length !== 0) {
        eventData.removed = removed;
        eventData.type = "remove";
      }
      if (Object.keys(put).length !== 0) {
        eventData.put = put;
        eventData.type = eventData.type ? "put/remove" : "put";
      }
      if (eventData.removed || eventData.put) this.fireDataEvent("change", eventData);
    },

    /**
     * Removes a key:value pair
     *
     * @param key
     *          {String|Entry} the key to remove
     * @returns {Object} the previous value for the key, or undefined
     */
    remove(key) {
      var entry;
      if (key instanceof zx.data.Entry) {
        if (qx.core.Environment.get("qx.debug")) {
          qx.core.Assert.assertIdentical(key, this.__lookupEntries[this.__getKey(key.getKey())]);
        }
        entry = key;
      } else {
        var id = this.__getKey(key);
        entry = this.__lookupEntries[id];
      }

      if (entry) {
        this.__detachEntry(entry);
        this.getValues().remove(entry.getValue());
        this.getKeys().remove(entry.getKey());
        this.fireDataEvent("change", {
          type: "remove",
          removed: [
            {
              key: entry.getKey(),
              value: entry.getValue(),
              entry: entry
            }
          ]
        });
      }

      return entry ? entry.getValue() : undefined;
    },

    /**
     * Removes all entries from the map
     */
    removeAll() {
      var old = [];
      for (var id in this.__lookupEntries) {
        var entry = this.__lookupEntries[id];
        old.push({
          key: entry.getKey(),
          value: entry.getValue(),
          entry: entry
        });
        this.__detachEntry(entry);
      }
      this.getValues().removeAll();
      this.getKeys().removeAll();
      this.fireDataEvent("change", {
        type: "remove",
        removed: old
      });
    },

    /**
     * Equivalent of Array.forEach for every key/value pair
     * @param cb {Function} called with (key, value, entry)
     */
    forEach(cb) {
      var t = this;
      return Object.keys(this.__lookupEntries).forEach(function (id) {
        var entry = this.__lookupEntries[id];
        return cb(entry.getKey(), entry.getValue(), entry);
      });
    },

    /**
     * Equivalent of Array.some for every key/value pair
     * @param cb {Function} called with (key, value)
     */
    some(cb) {
      var t = this;
      return Object.keys(this.__lookupEntries).some(function (id) {
        var entry = this.__lookupEntries[id];
        return cb(entry.getKey(), entry.getValue(), entry);
      });
    },

    /**
     * Equivalent of Array.every for every key/value pair
     * @param cb {Function} called with (key, value)
     */
    every(cb) {
      var t = this;
      return Object.keys(this.__lookupEntries).every(function (id) {
        var entry = this.__lookupEntries[id];
        return cb(entry.getKey(), entry.getValue(), entry);
      });
    },

    /**
     * Number of entries in the map
     *
     * @returns {Integer}
     */
    getLength() {
      return this.getKeys().getLength();
    },

    /**
     * Returns true if the map is empty
     *
     * @returns {Boolean}
     */
    isEmpty() {
      return this.getLength() == 0;
    },

    /**
     * Detects whether the key is in use
     *
     * @param key
     *          {String}
     * @returns {Boolean}
     */
    containsKey(key) {
      var id = this.__getKey(key);
      return this.__lookupEntries[id] !== undefined;
    },

    /**
     * Detects whether the value is in use
     *
     * @param value
     *          {Object}
     * @returns {Boolean}
     */
    containsValue(value) {
      return this.getValues().indexOf(value) > -1;
    },

    /**
     * Returns a copy of the native object containing the lookup; note that this cannot
     * work (and will throw an exception) if the keys are hashed, because it is not possible
     * to use objects as keys in a native map (@see toArray instead)
     */
    toObject() {
      if (this.__keysAreHashed) {
        throw new Error("Cannot export as an object because the map uses keys which are objects");
      }

      var result = {};
      var lookup = this.__lookupEntries;
      this.getKeys().forEach(
        function (id) {
          var entry = this.__lookupEntries[id];
          result[entry.getKey()] = entry.getValue();
        }.bind(this)
      );

      return result;
    },

    /**
     * Outputs the map as an array of objects with key & value properties; this is a guaranteed
     * export mechanism because it will work whether the keys are hashed or not
     */
    toArray() {
      var result = [];
      for (var id in this.__lookupEntries) {
        var entry = this.__lookupEntries[id];
        result.push({
          key: entry.getKey(),
          value: entry.getValue()
        });
      }
      return result;
    },

    /**
     * Apply method for values property
     *
     * @param value
     *          {Object}
     * @param oldValue
     *          {Object}
     */
    _applyValues(value, oldValue) {
      if (oldValue) throw new Error("Cannot change property values of zx.data.Map");
    },

    /**
     * Apply method for keys property
     *
     * @param value
     *          {Object}
     * @param oldValue
     *          {Object}
     */
    _applyKeys(value, oldValue) {
      if (oldValue) throw new Error("Cannot change property keys of zx.data.Map");
    },

    /**
     * Apply method for entries property
     *
     * @param value
     *          {Object}
     * @param oldValue
     *          {Object}
     */
    _applyEntries(value, oldValue) {
      if (oldValue) throw new Error("Cannot change property entries of zx.data.Map");
    },

    /**
     * Transform for keyClass and valueClass, converts strings to classes
     */
    _transformToClass(value) {
      if (value) value = qx.Class.getByName(value);
      return value;
    }
  }
});
