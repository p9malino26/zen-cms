qx.Class.define("zx.io.api.server.Request", {
  extend: qx.core.Object,

  properties: {
    transport: {
      init: null,
      nullable: true,
      check: "zx.io.api.transport.ITransport"
    },

    headers: {
      check: "qx.data.Array"
    },

    body: {
      init: null,
      nullable: true
    }
  },

  members: {}
});
