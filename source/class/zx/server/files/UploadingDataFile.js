const path = require("path");
const fs = require("fs");

qx.Class.define("zx.server.files.UploadingDataFile", {
  extend: zx.io.remote.UploadingFile,

  members: {
    /** @type{zx.server.files.DataFile} the file being uploaded */
    __dataFile: null,

    /**
     * @override
     */
    _createWriteStream() {
      let mediaFile = (this.__dataFile = new zx.server.files.DataFile());
      let fields = this.getFields();
      let filename = this.getFilename();
      mediaFile.setTitle(fields.title || "Untitled");
      let ext = path.extname(filename);
      mediaFile.setExtension(ext);
      mediaFile.setOriginalFilename(filename);
      let outputFilename = mediaFile.getFilename();
      return fs.createWriteStream(outputFilename);
    },

    /**
     * @Override
     */
    async _uploadCompleted() {
      this.setReturnValue(this.__dataFile);
      zx.server.Standalone.getInstance().putObject(this.__dataFile);
      return super();
    }
  }
});
