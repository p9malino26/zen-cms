qx.Class.define("zx.server.email.Attachment", {
  extend: zx.server.Object,

  properties: {
    contentType: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      check: "String",
      nullable: true,
      init: null
    },

    size: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      check: "Integer",
      nullable: true,
      init: null
    },

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
