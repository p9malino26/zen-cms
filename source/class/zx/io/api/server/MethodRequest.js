qx.Class.define("zx.io.api.server.MethodRequest", {
  extend: qx.core.Object,
  construct() {
    super();
  },
  properties: {
    params: {
      nullable: true,
      check: "Object"
    }
  }
});
