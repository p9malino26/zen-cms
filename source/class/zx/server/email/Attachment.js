let mime;
const fs = require("node:fs");
qx.Class.define("zx.server.email.Attachment", {
  extend: zx.server.Object,

  async defer() {
    mime = (await import("mime")).default;
  },

  properties: {
    name: {
      check: "String",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeName",
      nullable: true,
      init: null
    },

    path: {
      validate(value) {
        this.__isPathLike(value, "path");
      },
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changePath",
      nullable: true,
      init: null
    },

    data: {
      check: "String",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeData",
      nullable: true,
      init: null
    },

    alternative: {
      validate(value) {
        this.__isAttachmentOrBoolean(value, "alternative");
      },
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeData",
      nullable: true,
      init: null
    }
  },

  members: {
    __isPathLike(value, propName) {
      if (typeof value === "string" || value instanceof Buffer || value instanceof URL) {
        return;
      }
      throw new qx.core.ValidationError(
        `Validation Error: value for property '${propName}' of class '${this.classname}' must either be a string, a Buffer, or a URL. Found ${value?.toString?.() ?? value}`
      );
    },
    __isAttachmentOrBoolean(value, propName) {
      if (typeof value === "boolean" || value instanceof zx.server.email.Attachment) {
        return;
      }
      throw new qx.core.ValidationError(
        `Validation Error: value for property '${propName}' of class '${this.classname}' must either be a boolean, or an instance of zx.server.email.Attachment. Found ${value?.toString?.() ?? value}`
      );
    },

    prepare() {
      const attachmentData = {};

      const path = this.getPath();
      if (path) {
        const stream = fs.createReadStream(path);
        if (stream) {
          attachmentData.stream = stream;
        } else {
          attachmentData.path = path;
        }
        attachmentData.name = path;
      }

      const name = this.getName();
      if (name) {
        attachmentData.name = name;
      }

      const data = this.getData();
      if (data) {
        attachmentData.data = data;
      }

      const alternative = this.getAlternative();
      if (alternative) {
        attachmentData.alternative = alternative;
      }

      const fileExt = attachmentData.name?.split(".").pop();
      const mimeType = mime.getType(fileExt);
      if (mimeType) {
        attachmentData.type = mimeType;
      }

      return attachmentData;
    }
  },

  statics: {
    compose(data) {
      return new zx.server.email.Attachment().set(data);
    }
  }
});
