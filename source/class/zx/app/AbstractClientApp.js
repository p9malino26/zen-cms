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
  include: [zx.app.MClientApp],

  construct() {
    super();
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
    async main() {
      await super.main();

      qx.log.appender.Native;
      await this._zxInitialise();

      let loginApi = await this.getNetController().getUriMapping(zx.server.auth.LoginApi.classname);
      let user = await loginApi.getCurrentUser();
      this.setUser(user);
    },

    /**
     * Apply for `user`
     */
    _applyUser(value, oldValue) {
      // Nothing
    }
  }
});
