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

qx.Class.define("zx.test.TestsAppThinClient", {
  extend: zx.thin.ThinClientApp,
  include: [zx.test.MTestsAppThinClient],

  construct() {
    super();
    qx.log.appender.Native;
  }
});
