/**
 * Helper functions to convert data that has been returned from Mongo into read-only Qooxdoo objects.
 * These objects behave in the exact same way as server objects, but changes to them aren't saved in the database.
 * 
 * Useful when we want Qooxdoo objects but don't want to instantiate full server objects
 * because doing that is expensive.
 */
qx.Class.define("zx.utils.marshal.Marshal", {
  statics: {
    /**@type {qx.data.marshal.Json} */
    __marhsaller: null,

    /**
     * Converts an array of POJOs representing server objects to Qooxdoo objects.
     * Each object will have a method toUuid().
     *
     * @param {Object[] | qx.data.Array<Object>} obj Array of POJOs
     * @return {qx.data.Array<qx.core.Object>} Array of Qooxdoo objects
     */
    toProxies(obj) {
      return zx.utils.marshal.Marshal.__doit(obj);
    },
    
    /**
     * Converts a POJO representing a server object to a Qooxdoo object.
     * The returned object will have a method toUuid().
     *
     * @param {Object} obj
     * @return {qx.core.Object}
     */
    toProxy(obj) {
      return zx.utils.marshal.Marshal.__doit(obj);
    },

    /**
     * Converts a POJO or array of POJOs representing server objects to Qooxdoo objects.
     * If an array of POJOs is passed, the result will be a qx.data.Array of Qooxdoo objects.
     *
     * Each object will have a method toUuid().
     *
     * @param {Object | Object[] | qx.data.Array<Object>} obj POJO or array of POJOs
     * @return {qx.core.Object | qx.data.Array<qx.core.Object>} Qooxdoo object or array of Qooxdoo objects
     */
    __doit(obj) {
      const thisClass = zx.utils.marshal.Marshal;

      if (obj instanceof qx.data.Array) {
        obj = obj.toArray();
      }

      if (!thisClass.__marshaller) {
        const delegate = {
          getModelMixins() {
            return zx.utils.marshal.MServerObjectProxy;
          }
        };
        thisClass.__marshaller = new qx.data.marshal.Json(delegate);
      }
      let marshaller = thisClass.__marshaller;
      marshaller.toClass(obj);
      obj = marshaller.toModel(obj, false);

      return obj;
    }
  }
});