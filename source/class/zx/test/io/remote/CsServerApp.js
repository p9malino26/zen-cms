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
 * @ignore(process)
 * @ignore(require)
 */

qx.Class.define("zx.test.io.remote.CsServerApp", {
  extend: qx.application.Basic,

  members: {
    async main() {
      if (qx.core.Environment.get("qx.debug")) {
        qx.log.appender.Native;
      }

      // Controller manages the objects and their serialisation across the DataSource
      let ctlr = (this._controller = new zx.io.remote.NetworkController());

      // Listener is specific to a given platform (postMessage, Xhr, etc)
      new zx.io.remote.FastifyXhrListener(ctlr);
    }
  }
});
