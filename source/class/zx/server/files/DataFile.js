const fs = require("fs");
const path = require("path");

qx.Class.define("zx.server.files.DataFile", {
  extend: zx.server.Object,
  include: [zx.server.MObjectLastModified, zx.server.files.MDataFile],
  implement: [zx.io.persistence.IObjectNotifications],
  "@": [
    new zx.io.remote.anno.Class().set({
      clientMixins: "zx.server.files.MDataFile"
    }),

    zx.io.persistence.anno.Class.DEFAULT
  ],

  properties: {
    /** Description of the file */
    title: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeTitle",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT, zx.server.anno.LastModified.DEFAULT, zx.utils.anno.Json.PUBLIC]
    },

    /** Which object "owns" (ie uploaded) the file - a practice, a brand, or global etc */
    owner: {
      init: null,
      nullable: true,
      check: "zx.server.Object",
      event: "changeOwner",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT, zx.server.anno.LastModified.DEFAULT]
    },

    /** Original filename of the file */
    originalFilename: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeOriginalFilename",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT, zx.server.anno.LastModified.DEFAULT, zx.utils.anno.Json.PUBLIC]
    },

    /** Extension for the file and for URLs, including the "." */
    extension: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeExtension",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT, zx.server.anno.LastModified.DEFAULT, zx.utils.anno.Json.PUBLIC]
    },

    /** Type of the file */
    type: {
      init: null,
      nullable: true,
      event: "changeType",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT, zx.server.anno.LastModified.DEFAULT, zx.utils.anno.Json.PUBLIC]
    },

    /** SHA */
    serverSha: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeServerSha",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT, zx.server.anno.LastModified.DEFAULT, zx.utils.anno.Json.PUBLIC]
    }
  },

  members: {
    /**
     * Returns a filename where the blob is [to be] stored on disk
     *
     * @returns {String}
     */
    getFilename() {
      let server = zx.server.Standalone.getInstance();
      let filename = server.getBlobFilename(this.toUuid()) + (this.getExtension() || "");
      let dirname = path.dirname(filename);
      fs.mkdirSync(dirname, { recursive: true });
      return filename;
    },

    "@deleteFromDisk": zx.io.remote.anno.Method.DEFAULT,
    async deleteFromDisk() {
      let fileName = this.getFilename();
      fs.rmSync(fileName);

      let server = zx.server.Standalone.getInstance();
      await server.deleteObject(this);
    }
  }
});
