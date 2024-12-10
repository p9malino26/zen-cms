/**
 * Object containing the parameters for a method call
 */
qx.Class.define("zx.io.api.server.MethodRequest", {
  extend: qx.core.Object,
  construct() {
    super();
    this.initParams({});
  },
  properties: {
    /**
     * Parameters.
     * Combination of the query parameters and the URL parameters
     */
    params: {
      nullable: true,
      check: "Object",
      deferredInit: true
    }
  }
});
