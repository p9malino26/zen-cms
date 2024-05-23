/* ************************************************************************
 *
 *  Zen [and the art of] CMS
 *
 *  https://zenesis.com
 *
 *  Copyright:
 *    2019-2024 Zenesis Ltd, https://www.zenesis.com
 *
 *  License:
 *    MIT (see LICENSE in project root)
 *
 *  Authors:
 *    John Spackman (john.spackman@zenesis.com, @johnspackman)
 *
 * ************************************************************************ */

/**
 * @use(zx.server.CmsConfiguration)
 * @use(zx.server.auth.LoginApi)
 */
qx.Mixin.define("zx.app.MClientApp", {
  members: {
    /** @type{zx.io.remote.NetworkController} the network controller */
    __netController: null,

    /** @type{zx.io.remote.BrowserXhrEndpoint} the browser endpoint for network I/O */
    __endpoint: null,

    /** @type{com.zenesis.qx.upload.UploadMgr} manager for uploads */
    __uploadMgr: null,

    /**
     * Called to initalise the mixin for I/O to the ZX server
     */
    async _zxInitialise() {
      if (this.__endpoint) {
        debugger;
        throw new Error("Application initialised multiple times!");
      }

      zx.utils.PostMessageRelayLogger.startReceiver();

      // Controller manages the objects and their serialisation
      this.__netController = new zx.io.remote.NetworkController();

      // Connect to the parent window because we know that we are in an iframe created by PeerOne
      let endpoint = (this.__endpoint = new zx.io.remote.BrowserXhrEndpoint().set({
        timeout: 60000,
        polling: true
      }));

      if (!endpoint.isPolling()) {
        this.warn(" *************** POLLING TURNED OFF IN CODE (uploads will be broken) ********* ");
      }
      this.__netController.addEndpoint(endpoint);
      await endpoint.open();

      // For transparent remote method calls
      zx.io.remote.NetworkEndpoint.setDefaultEndpoint(endpoint);
    },

    /**
     * Obtains an upload manager for Zen Cms, configured to use the current session
     *
     * @returns {com.zenesis.qx.upload.UploadMgr}
     */
    getZxUploadMgr() {
      if (!this.__uploadMgr) {
        let url = this.getNetEndpoint().getUploadUrl();
        this.__uploadMgr = new com.zenesis.qx.upload.UploadMgr(null, url);
        this.__uploadMgr.getUploadHandler().setExtraHeaders({
          "X-Zx-Io-Remote-SessionUuid": this.__endpoint.getUuid(),
          "X-Zx-Io-Remote-ApplicationName": qx.core.Environment.get("qx.compiler.applicationName"),
          "X-Zx-Io-Remote-Share-Connection": "" + this.__endpoint.getShareConnection()
        });

        this.__uploadMgr.addListener("addFile", evt => {
          var file = evt.getData();
          file.setParam("X-Zx-Io-Remote-SessionUuid", this.__endpoint.getUuid());
          file.setParam("X-Zx-Io-Remote-ApplicationName", qx.core.Environment.get("qx.compiler.applicationName"));
          var progressListenerId = file.addListener("changeProgress", evt => {
            var file = evt.getTarget();
            var uploadedSize = evt.getData();

            this.debug("Upload " + file.getFilename() + ": " + uploadedSize + " / " + file.getSize() + " - " + Math.round((uploadedSize / file.getSize()) * 100) + "%");
          });
        });
      }

      return this.__uploadMgr;
    },

    /**
     * Gets a named API from the server; the API must be registered in the server.
     *
     * If the `apiName` is a class, then the classname is used
     *
     * @param {String|Class} apiName
     * @returns {qx.core.Object}
     */
    async getApi(apiName) {
      if (typeof apiName !== "string") {
        apiName = apiName.classname;
      }
      let cmsConfig = await this.getNetController().getUriMapping("zx.server.CmsConfiguration");
      let api = cmsConfig.getApi(apiName);
      return api;
    },

    /**
     * Returns network controller for server i/o
     *
     * @returns {ax.io.remote.NetworkController}
     */
    getNetController() {
      return this.__netController;
    },

    /**
     * Returns the network endpoint that communicates with the server
     *
     * @returns {zx.io.remote.NetworkEndpoint}
     */
    getNetEndpoint() {
      return this.__endpoint;
    }
  }
});
