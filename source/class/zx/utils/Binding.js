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

qx.Class.define("zx.utils.Binding", {
  extend: qx.core.Object,

  construct: function (path, model, bidirectional) {
    this.base(arguments);
    this.__stack = [];
    this.setBidirectional(bidirectional !== false);
    if (path !== undefined) this.setPath(path);
    if (model) this.setModel(model);
  },

  destruct: function () {
    this.reset();
  },

  properties: {
    /** Whether to keep this.value updated */
    bidirectional: {
      init: true,
      nullable: false,
      check: "Boolean",
      event: "changeBidirectional"
    },

    /** Path into model */
    path: {
      init: null,
      nullable: true,
      event: "changePath",
      apply: "_applyPath"
    },

    /** Object to observe */
    model: {
      init: null,
      nullable: true,
      event: "changeModel",
      apply: "_applyModel"
    }

    /** Psuedo property, value observed
    value: {
      init: null,
      nullable: true,
      event: "changeValue",
      apply: "_applyValue"
    }*/
  },

  events: {
    /** Fired when value changes */
    changeValue: "qx.event.type.Data"
  },

  members: {
    __stack: null,
    __value: null,
    __inSetValue: false,

    /**
     * Removes the model and the paths
     */
    reset: function () {
      this.set({ model: null, path: null });
    },

    /**
     * Apply for path
     */
    _applyPath: function (path, oldPath) {
      var model = this.getModel();
      var oldValue;
      if (oldValue && model) {
        oldValue = this.getValue();
        this._unbindChild(0);
      }
      if (path !== null) {
        var segs = path.split(".");
        this.__stack = [];
        for (var i = 0; i < segs.length; i++) {
          var data = {};
          var pos = segs[i].indexOf("[");
          if (pos > -1) {
            data.path = segs[i].substring(0, pos);
            data.index = segs[i].substring(pos + 1, segs[i].length - 1);
          } else {
            data.path = segs[i];
          }
          this.__stack.push(data);
        }
        if (model) {
          this._bindChild(0, model);
          this.__value = this.getValue();
        }
      }
      if (path === null || !model) {
        if (oldValue !== undefined && oldValue !== null) this.fireDataEvent("changeValue", oldValue, null);
      }
    },

    /**
     * Apply for model
     */
    _applyModel: function (model, oldModel) {
      var path = this.getPath();
      var oldValue;
      if (oldModel && path) {
        oldValue = this.getValue();
        this._unbindChild(0);
      }
      if (model && path !== null) {
        this._bindChild(0, model);
        this.__value = this.getValue();
      } else {
        if (oldValue !== undefined && oldValue !== null) this.fireDataEvent("changeValue", null, oldValue);
      }
    },

    /**
     * Sets the value
     */
    setValue: function (value) {
      if (!this.getBidirectional()) return;
      var data = this.__stack[this.__stack.length - 1];
      if (!data.parentModel) return;
      if (!this._sameValue(this.__value, value)) {
        this.__inSetValue = true;
        try {
          var upname = qx.lang.String.firstUp(data.path);
          if (data.index !== undefined) {
            var obj = upname.length == 0 ? data.parentModel : data.parentModel["get" + upname]();
            if (obj instanceof qx.data.Array) obj.setItem(parseInt(data.index, 10), value);
            else if (obj instanceof zx.data.Map) obj.put(data.index, value);
            else obj[data.index] = value;
          } else {
            data.parentModel["set" + upname](value);
          }
          var oldValue = this.__value;
          this.__value = value;
          this.fireDataEvent("changeValue", value, oldValue);
        } finally {
          this.__inSetValue = false;
        }
      }
    },

    /**
     * Compares two values for equivelance; specifically, if they are a date the
     * time is compared not the object
     */
    _sameValue: function (left, right) {
      if (left === right) return true;
      if (left === null || right === null || left === undefined || right === undefined) return false;
      if (left instanceof Date && right instanceof Date) return left.getTime() == right.getTime();
      return false;
    },

    /**
     * Gets the value
     */
    getValue: function (value) {
      if (this.__stack.length == 0) return null;

      var data = this.__stack[this.__stack.length - 1];
      if (!data.parentModel) return null;

      var upname = qx.lang.String.firstUp(data.path);
      if (data.index !== undefined) {
        var obj = upname.length == 0 ? data.parentModel : data.parentModel["get" + upname]();
        if (obj instanceof qx.data.Array) return obj.getItem(data.index) || null;
        if (obj instanceof zx.data.Map) return obj.get(data.index) || null;
        return obj[data.index] || null;
      } else if (upname.length) {
        return data.parentModel["get" + upname]();
      } else {
        return data.parentModel;
      }
    },

    /**
     * Called to bind listeners to the child object at a depth into the path
     */
    _bindChild: function (depth, parentModel) {
      var t = this;
      var data = this.__stack[depth];

      function onArrayChange(evt) {
        var arrayValue = evt.getTarget();
        var childValue = null;
        if (arrayValue instanceof qx.data.Array) childValue = arrayValue.getItem(parseInt(data.index, 10));
        else if (childValue instanceof zx.data.Map) childValue = arrayValue.get(data.index);
        else childValue = arrayValue[data.index];
        if (childValue === undefined) childValue = null;

        if (depth == t.__stack.length - 1) {
          if (childValue === t.getValue()) {
            if (!t.__inSetValue) t.fireDataEvent("changeValue", childValue, childValue);
          }
        } else {
          t._unbindChild(depth + 1);
          if (childValue) t._bindChild(depth + 1, childValue);
        }
      }

      function set(childValue, oldChildValue) {
        if (childValue === undefined) childValue = null;

        if (data.index !== undefined) {
          if (data.arrayListenerId) {
            data.arrayValue.removeListenerById(data.arrayListenerId);
            delete data.arrayListenerId;
            delete data.arrayValue;
          }

          if (childValue !== null) {
            if (childValue instanceof qx.data.Array) {
              data.arrayValue = childValue;
              data.arrayListenerId = data.arrayValue.addListener("change", onArrayChange);
              childValue = childValue.getItem(parseInt(data.index, 10));
            } else if (childValue instanceof zx.data.Map) {
              childValue = childValue.get(data.index);
              // TODO
            } else childValue = childValue[data.index];

            if (childValue === undefined) childValue = null;
          }
        }

        if (depth == t.__stack.length - 1) {
          if (childValue === t.getValue()) {
            if (!t.__inSetValue) t.fireDataEvent("changeValue", childValue, childValue);
          }
        } else {
          var oldDescendantValue = t.getValue();
          t._unbindChild(depth + 1);
          if (childValue) t._bindChild(depth + 1, childValue);
          else if (!t.__inSetValue && oldDescendantValue)
            // this should only fire once because children will have already been unbound
            t.fireDataEvent("changeValue", null, oldDescendantValue);
        }
      }

      var upname = qx.lang.String.firstUp(data.path);
      data.parentModel = parentModel;
      if (upname.length) {
        data.listenerId = parentModel.addListener(
          "change" + upname,
          function (evt) {
            set(evt.getData(), evt.getOldData());
          },
          this
        );
        set(parentModel["get" + upname]());
      } else set(parentModel);
    },

    /**
     * Called to unbind listeners etc from a child
     */
    _unbindChild: function (depth) {
      var data = this.__stack[depth];
      if (data.listenerId && depth < this.__stack.length - 1) this._unbindChild(depth + 1);
      if (data.listenerId) {
        data.parentModel.removeListenerById(data.listenerId);
        delete data.listenerId;
        delete data.parentModel;
      }
      if (data.arrayListenerId) {
        data.arrayValue.removeListenerById(data.arrayListenerId);
        delete data.arrayListenerId;
        delete data.arrayValue;
      }
    }
  }
});
