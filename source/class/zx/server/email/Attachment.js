/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2025 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */

const fs = require("fs");

/**
 * Represents an email attachment.
 */
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

    /** Filename to present to the email client */
    name: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      check: "String",
      event: "changeName",
      nullable: true,
      init: null
    },

    /** Filename on disk of the actual file, unless `blobUuid` is given */
    path: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changePath",
      nullable: true,
      init: null
    },

    /** UUID of the blob file, unless `path` is given */
    blobUuid: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      check: "String",
      nullable: true,
      init: null
    }
  },

  statics: {
    async createFromDatafile(datafile) {
      let stat = await fs.promises.stat(datafile.getFilename());
      return new zx.server.email.Attachment().set({
        name: datafile.getPresentableFilename(),
        blobUuid: datafile.toUuid(),
        size: stat.size,
        path: "/zx/blobs/" + datafile.toUuid() + datafile.getExtension()
      });
    }
  }
});
