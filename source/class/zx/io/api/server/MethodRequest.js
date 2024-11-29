qx.Class.define("zx.io.api.server.MethodRequest", {
  extend: qx.core.Object,
  construct() {
    super();
    this.initParams({});
  },
  properties: {
    params: {
      nullable: true,
      check: "Object",
      deferredInit: true
    }
  }
});
