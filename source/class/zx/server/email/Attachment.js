qx.Class.define("zx.server.email.Attachment", {
  extend: zx.server.Object,

  properties: {
    name: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      check: "String",
      event: "changeName",
      nullable: true,
      init: null
    },

    path: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changePath",
      nullable: true,
      init: null
    }
  }
});
