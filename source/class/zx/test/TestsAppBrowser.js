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
 * @usefont(FontAwesome)
 * @usefont(FontAwesomeBrands)
 * @usefont(FontAwesomeSolid)
 * @usefont(Montserrat)
 * @use(zx.cms.content.ContentPiece)
 */
qx.Class.define("zx.test.TestsAppBrowser", {
  extend: zx.app.demo.DemoRunnerApp,

  members: {
    /**
     * @Override
     */
    async main() {
      await this.base(arguments);

      let runner = this.getQxObject("runner");
      this.loadDemos(runner);
      runner.allDemosLoaded();
    },

    loadDemos(runner) {
      runner.addDemonstrator(new zx.app.demo.ThinDemonstrator("/zx/app/login/login.html"));
      runner.addDemonstrator(new zx.app.demo.ThinDemonstrator("/thin-ui/demo-button.html"));

      runner.addDemonstrator(new zx.test.app.pages.DemoPageEditor());

      // On hold (hardly started)
      // runner.addDemonstrator(new zx.test.app.pages.DemoUrlTreeEditor());

      runner.addDemonstrator(new zx.test.app.auth.DemoUsersEditor());
      runner.addDemonstrator(new zx.test.jsx.TestJsx());
      runner.addDemonstrator(new zx.test.jsx.TestJsxBrowser());
      runner.addDemonstrator(new zx.test.io.remote.DemoRemoteWindows());
      runner.addDemonstrator(new zx.test.io.remote.DemoRemoteXhrClient());
      runner.addDemonstrator(new zx.test.io.remote.DemoProxyClient());
      runner.addDemonstrator(new zx.test.ui.editor.DemoDateTimeField());
      runner.addDemonstrator(new zx.test.ui.editor.DemoEditor());
    }
  }
});
