/* ************************************************************************
 *
 *  Zen [and the art of] CMS
 *
 *  https://zenesis.com
 *
 *  Copyright:
 *    2019-2022 Zenesis Ltd, https://www.zenesis.com
 *
 *  License:
 *    MIT (see LICENSE in project root)
 *
 *  Authors:
 *    John Spackman (john.spackman@zenesis.com, @johnspackman)
 *
 * ************************************************************************ */

qx.Class.define("zx.app.AbstractClientApp", {
  extend: qx.application.Standalone,

  construct() {
    this.base(arguments);
    if (!zx.app.AbstractClientApp.__INSTANCE) {
      zx.app.AbstractClientApp.__INSTANCE = this;
    } else {
      debugger;
      throw new Error("Application created multiple times!");
    }
  },

  properties: {
    user: {
      init: null,
      nullable: true,
      check: "zx.server.auth.User",
      event: "changeUser",
      apply: "_applyUser"
    }
  },

  members: {
    __netController: null,
    __endpoint: null,
    __uploadMgr: null,

    async main() {
      if (this.__endpoint) {
        debugger;
        throw new Error("Application initialised multiple times!");
      }
      await this.base(arguments);

      qx.log.appender.Native;
      zx.utils.PostMessageRelayLogger.startReceiver();

      // Controller manages the objects and their serialisation
      this.__netController = new zx.io.remote.NetworkController();

      // Connect to the parent window because we know that we are in an iframe created by PeerOne
      let endpoint = (this.__endpoint = new zx.io.remote.BrowserXhrEndpoint().set({
        timeout: 60000,
        polling: true
      }));
      if (!endpoint.isPolling()) {
        this.warn(" *************** POLLING TURNED OFF IN CODE ********* ");
      }
      this.__netController.addEndpoint(endpoint);
      await endpoint.open();

      // For transparent remote method calls
      zx.io.remote.NetworkEndpoint.setDefaultEndpoint(endpoint);

      let loginApi = await this.__netController.getUriMapping(zx.server.auth.LoginApi.classname);
      let user = await loginApi.getCurrentUser();
      this.setUser(user);
    },

    getUploadMgr() {
      if (!this.__uploadMgr) {
        let url = this.getNetEndpoint().getUploadUrl();
        this.__uploadMgr = new com.zenesis.qx.upload.UploadMgr(null, url);
        this.__uploadMgr.getUploadHandler().setExtraHeaders({
          "X-Zx-Io-Remote-SessionUuid": this.__endpoint.getUuid(),
          "X-Zx-Io-Remote-ApplicationName": qx.core.Environment.get("qx.compiler.applicationName")
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
     * Apply for `user`
     */
    _applyUser(value, oldValue) {
      // Nothing
    },

    /**
     * Gets a named API from the server
     *
     * @param {String} apiName
     * @returns {qx.core.Object}
     */
    async getApi(apiName) {
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

    getNetEndpoint() {
      return this.__endpoint;
    }
  }
});
