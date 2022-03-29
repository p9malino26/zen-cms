/**
 * Implemented on the server to receive a file being uploaded
 */
qx.Interface.define("zx.io.remote.IUploadReceiver", {
  members: {
    /**
     * Provides an instance of `zx.io.remote.UploadingFile` that is used to consume the upload
     *
     * @param {String} filename filename given by the client
     * @param {Map} fields object with fields provided by the client
     * @return {zx.io.remote.UploadingFile}
     */
    getUploadingFile(filename, fields) {}
  }
});
