/**
 * Implemented on the client to be notified when a file has been uploaded to the server
 */
qx.Interface.define("zx.io.remote.IUploadCompleted", {
  members: {
    /**
     * Called when the upload has been completed
     *
     * @param {zx.io.persistence.IObject?} value returned by the IUploadReceiver
     */
    onUploadCompleted(value) {}
  }
});
