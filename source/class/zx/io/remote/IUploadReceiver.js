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
