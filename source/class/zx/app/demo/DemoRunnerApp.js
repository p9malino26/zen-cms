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
 * Basic app for running demos; you probably want to derive from this (eg @see `zx.test.BrowserTestsApp`)
 *
 * @require(qx.core.Init)
 */
qx.Class.define("zx.app.demo.DemoRunnerApp", {
  extend: zx.app.AbstractClientApp,

  members: {
    /**
     * @Override
     */
    async main() {
      await super.main();

      let doc = this.getRoot();
      let runner = this.getQxObject("runner");
      doc.add(runner, { left: 0, top: 0, right: 0, bottom: 0 });
    },

    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "runner":
          return new zx.app.demo.DemoRunner();
      }

      return super._createQxObjectImpl(id);
    }
  }
});
