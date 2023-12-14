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
 * Handles persistence of a reference to a qx.core.Object
 */
qx.Class.define("zx.io.persistence.ClassRefIo", {
  extend: qx.core.Object,
  implement: [zx.io.persistence.IIo],

  construct(clazz) {
    super();
    this.__clazz = clazz;
  },

  members: {
    /** {qx.Class} The class */
    __clazz: null,

    /**
     * Returns the class this works on
     *
     * @return {qx.Class}
     */
    getClass() {
      return this.__clazz;
    },

    /**
     * Takes a JSON value and returns an object; this could be a reference or a full object, or null.
     * It is up to the implementation to determine how it gets the instance, eg it could locate it in a
     * pool, load it, or create a brand new one
     *
     * NOTE: may return a promise
     *
     * @param endpoint {zx.io.persistence.Endpoint} the endpoint
     * @param json {Object?} the JSON to decode
     * @return {qx.core.Object?} the found object
     */
    async fromJson(endpoint, json) {
      if (json === null) {
        return null;
      }
      let clazz = qx.Class.getByName(json._classname);
      if (!clazz) {
        this.error(`Cannot deserialize class because there is no class called ${json._classname}`);
        return null;
      }

      if (json.$query) {
        let query = qx.lang.Object.clone(json.$query);
        query._classname = json._classname;
        let result = await endpoint.getDataFromQuery(query, {
          _classname: 1,
          _uuid: 1
        });

        if (result) {
          json = {
            _uuid: result.json._uuid,
            _classname: result.json._classname
          };
        }
      }

      if (!json._uuid) {
        this.error(`Cannot deserialize class because there is no uuid for ${json._classname}`);
        return null;
      }

      let obj = endpoint.getController().getByUuidNoWait(clazz, json._uuid, true);
      return obj;
    },

    /**
     * Serialises an object into JSON in a way that can be retrieved later via fromJson.  It is up to the
     * implementation how it serialises it and in what form, but it must be reversible via fromJson
     *
     * @param endpoints {zx.io.persistence.Endpoint} the endpoints
     * @param obj {qx.core.Object?} the object to serialize
     * @return {Object?} the JSON
     * @async May return a Promise
     */
    toJson(endpoints, obj) {
      if (obj === null) {
        return null;
      }
      endpoints.forEach(endpoint => endpoint.putDependentObject(obj));
      return { _uuid: obj.toUuid(), _classname: obj.classname };
    }
  }
});
