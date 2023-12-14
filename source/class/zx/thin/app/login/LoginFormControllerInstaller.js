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

qx.Class.define("zx.thin.app.login.LoginFormControllerInstaller", {
  extend: zx.thin.core.FeatureClientInstaller,

  members: {
    _createFeature(clazz, options) {
      if (qx.core.Environment.get("qx.debug")) {
        this.assertTrue(qx.Class.isSubClassOf(clazz, zx.thin.app.login.LoginForm));
      }
      let ctlr = zx.thin.app.login.LoginController.getInstance();
      if (options.options.redirectTo) {
        ctlr.setRedirectTo(options.options.redirectTo);
      }
      return ctlr.getQxObject("loginForm");
    }
  }
});
