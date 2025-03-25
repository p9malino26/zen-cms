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

qx.Class.define("zx.io.remote.UploadingFile", {
  extend: qx.core.Object,

  construct(filename, fields, outputFilename) {
    super();
    this.__filename = filename;
    this.__fields = qx.lang.Object.clone(fields);
    this.__outputFilename = outputFilename;
  },

  events: {
    /** Fired when the upload is complete */
    uploadCompleted: "qx.event.type.Event"
  },

  members: {
    /** @type{String} the original filename given in the upload */
    __filename: null,

    /** @type{String} where to writ ethe file to */
    __outputFilename: null,

    /** @type{Map<String,String>} the fields sent with the upload */
    __fields: null,

    /** @type{String} the hash of the uploaded file */
    __hash: null,

    /** @type{var?} the return value to send back to the client */
    __returnValue: null,

    /**
     * Writes the uploaded file.  The return value is output back to the client, just the return value
     * of any other server method call
     *
     * @param {ReadableStream} rs
     * @return {var?}
     */
    async writeFromStream(rs) {
      let ws = this._createWriteStream();
      let promise = new qx.Promise((resolve, reject) => {
        let shaStream = new zx.io.remote.NetworkEndpoint.ShaStream("sha256");
        rs.pipe(shaStream);
        rs.pipe(ws);
        rs.on("error", err => {
          shaStream.end();
          ws.end();
          reject(err);
        });
        shaStream.done().then(resolve);
      });
      this.__hash = await promise;
      return await this._uploadCompleted();
    },

    /**
     * Called when the upload is complete.  The default implementation will fire the `uploadCompleted`
     * event and then return the value given to `setReturnValue`
     *
     * @return {var?} the value to return to the client
     */
    async _uploadCompleted() {
      this.fireEvent("uploadCompleted");
      return this.__returnValue;
    },

    /**
     * Creates a nwrite stream to save the uploaded file into
     *
     * @returns {fs.WritableStream}
     */
    _createWriteStream() {
      return fs.createWriteStream(this.getOutputFilename());
    },

    /**
     * Returns the original filename given by the client
     *
     * @returns {String}
     */
    getFilename() {
      return this.__filename;
    },

    /**
     * Returns the fields given by the client
     *
     * @returns {Map<String, String>}
     */
    getFields() {
      return this.__fields;
    },

    /**
     * Returns the output filename
     *
     * @returns {String?}
     */
    getOutputFilename() {
      return this.__outputFilename;
    },

    /**
     * Returns the hash fo teh uploaded file
     *
     * @returns {String?} null if streaming upload not yet complete
     */
    getHash() {
      return this.__hash;
    },

    /**
     * Sets teh value to be returned to the client once the upload has completed
     *
     * @param {var?} returnValue
     */
    setReturnValue(returnValue) {
      this.__returnValue = returnValue;
    }
  }
});
