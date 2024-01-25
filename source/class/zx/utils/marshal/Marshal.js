qx.Class.define("zx.utils.marshal.Marshal", {
  statics: {
    /**
     * Converts a POJO or array of POJOs representing server objects to Qooxdoo objects.
     * If an array of POJOs is passed, the result will be a qx.data.Array of Qooxdoo objects.
     * 
     * Each object will have a method toUuid().
     * 
     * @param {Object | Object[] | qx.data.Array<Object>} obj POJO or array of POJOs
     * @return {qx.core.Object | qx.data.Array<qx.core.Object>} Qooxdoo object or array of Qooxdoo objects
     */
    __marhsaller: null,
    toProxies(obj) {
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
      };
      let marshaller = thisClass.__marshaller;
      marshaller.toClass(obj);
      obj = marshaller.toModel(obj, false);

      return obj;
    }
  }
});