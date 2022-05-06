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

qx.Class.define("zx.utils.JsonSerializer", {
  extend: qx.core.Object,

  construct(publicOnly) {
    this.base(arguments);
    this.__propertiesByClass = {};
    this.__publicOnly = publicOnly;
  },

  members: {
    __propertiesByClass: null,
    __publicOnly: true,

    /**
     * Gets (and caches) a list of property names for a class
     *
     * @param {qx.Class} clazz
     * @returns {Map<String,qx.Annotation>}
     */
    _getPropertiesFor(clazz) {
      let maybeClassname = clazz;
      if (typeof clazz == "string") clazz = qx.Class.getByName(clazz);
      if (!clazz) throw new Error(`Cannot serialize without a class (possibly for ${maybeClassname})`);
      let props = this.__propertiesByClass[clazz.classname];
      if (props !== undefined) return props;

      props = {};
      qx.Class.getProperties(clazz).forEach(name => {
        let annos = qx.Annotation.getProperty(clazz, name, zx.utils.anno.Json);
        let anno = annos[0] || null;
        if (anno) {
          if (!this.__publicOnly || anno.isPublic()) props[name] = anno;
        }
      });
      this.__propertiesByClass[clazz.classname] = props;
      return props;
    },

    /**
     * Serializes an object
     *
     * @param {*} obj
     * @returns {*}
     */
    serialize(obj) {
      let allResults = {
        json: null,
        refs: {}
      };

      const ref = obj => {
        if (obj instanceof qx.core.Object) {
          let id = null;
          if (typeof obj.toUuid == "function") id = obj.toUuid();
          if (!id) id = obj.toHashCode();
          if (allResults.refs[id] === undefined) {
            allResults.refs[id] = null;
            allResults.refs[id] = serializeImpl(obj);
          }
          return { $ref: id };
        }

        return serializeImpl(obj);
      };

      const serializeImpl = obj => {
        if (obj === null || obj === undefined) return null;

        if (obj instanceof qx.data.Array) return obj.toArray().map(tmp => serializeImpl(tmp));

        if (qx.lang.Type.isArray(obj)) return obj.map(tmp => serializeImpl(tmp));

        if (qx.lang.Type.isDate(obj)) return !isNaN(obj.getDate()) ? obj.toISOString() : null;

        if (qx.lang.Type.isError(obj)) return "" + obj;

        if (qx.lang.Type.isNumber(obj) || qx.lang.Type.isBoolean(obj) || typeof obj == "string") return obj;

        if (obj instanceof qx.core.Object) {
          let props = this._getPropertiesFor(obj.constructor);
          let result = {};

          for (let name in props) {
            let anno = props[name];
            let upname = qx.lang.String.firstUp(name);
            let value = obj["get" + upname]();
            if (name.match(/promotions/)) console.log(name);

            if (anno.isRefer()) {
              if (value instanceof qx.data.Array) result[name] = value.toArray().map(tmp => ref(tmp));
              else if (qx.lang.Type.isArray(obj)) result[name] = value.map(tmp => ref(tmp));
              else result[name] = ref(value, anno);
            } else {
              result[name] = serializeImpl(value);
            }
          }

          if (typeof obj.toJsonSerialize == "function") {
            obj.toJsonSerialize(result);
          }

          if (Object.keys(result).length == 0) {
            this.warn(`Cannot find any properties for ${obj.classname} (${obj})`);
            return {};
          }

          let id = null;
          if (typeof obj.toUuid == "function") id = obj.toUuid();
          if (!id) id = obj.toHashCode();
          result["_classname"] = obj.classname;
          result["_uuid"] = id;

          return result;
        }

        if (qx.lang.Type.isObject(obj)) {
          let result = {};
          for (let name in obj) result[name] = serializeImpl(obj[name]);
          return result;
        }

        return null;
      };

      allResults.json = serializeImpl(obj);
      return allResults;
    }
  },

  statics: {
    /** @type{zx.utils.JsonSerializer} default instance for public only properties */
    __publicOnly: null,

    /**
     * Defautl singleton instance for public-only fields
     *
     * @returns {zx.utils.JsonSerializer}
     */
    getPublicOnly() {
      if (!zx.utils.JsonSerializer.__publicOnly)
        zx.utils.JsonSerializer.__publicOnly = new zx.utils.JsonSerializer(true);
      return zx.utils.JsonSerializer.__publicOnly;
    }
  }
});
