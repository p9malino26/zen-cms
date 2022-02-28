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
    if (!zx.app.AbstractClientApp.__INSTANCE)
      zx.app.AbstractClientApp.__INSTANCE = this;
    else {
      debugger;
      throw new Error("Application created multiple times!");
    }
  },

  properties: {
    user: {
      init: null,
      nullable: true,
      check: "zx.server.auth.User",
      event: "changeUser"
    }
  },

  members: {
    __netController: null,
    __endpoint: null,

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
      let endpoint = (this.__endpoint =
        new zx.io.remote.BrowserXhrEndpoint().set({
          timeout: 60000,
          polling: true
        }));
      this.__netController.addEndpoint(endpoint);
      await endpoint.open();

      // For transparent remote method calls
      zx.io.remote.NetworkEndpoint.setDefaultEndpoint(endpoint);

      let loginApi = await this.__netController.getUriMapping(
        "zx.server.auth.LoginApi"
      );
      let user = await loginApi.getCurrentUser();
      this.setUser(user);
    },

    /**
     * Gets a named API from the server
     *
     * @param {String} apiName
     * @returns {qx.core.Object}
     */
    async getApi(apiName) {
      let cmsConfig = await this.getNetController().getUriMapping(
        "zx.server.CmsConfiguration"
      );
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
