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

qx.Class.define("zx.cms.app.auth.LoginFormFeature", {
  extend: zx.cms.content.SimpleFeature,

  construct() {
    super(zx.thin.app.login.LoginForm);
    this._clientInstallerClassname = "zx.thin.app.login.LoginFormControllerInstaller";
  }
});
