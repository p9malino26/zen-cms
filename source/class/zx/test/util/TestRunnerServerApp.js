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


/**
 * @require(qx.core.Init)
 * @ignore(process)
 * @ignore(require)
 */
qx.Class.define("zx.test.util.TestRunnerServerApp", {
  extend: qx.application.Basic,

  members: {
    async main() {
      qx.log.appender.Node;
      zx.test.TestRunner.runAll(zx.test.util.TestRequire);
      zx.test.TestRunner.runAll(zx.test.jsx.TestJsx);
    }
  }
});
