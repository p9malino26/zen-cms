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
 * @use(zx.test.io.remote.ProxyTestOne)
 * @use(zx.test.io.remote.RemoteThinXhrFeature)
 * @use(zx.test.io.remote.RemoteWindowChildFeature)
 * @use(zx.test.thin.DemoHelloWindow)
 * @use(zx.test.thin.DemoButtons)
 * @use(zx.test.thin.DemoDialog)
 * @use(zx.test.thin.DemoPopup)
 * @use(zx.test.thin.DemoSelection)
 * @use(zx.test.thin.DemoTextField)
 * @use(zx.test.thin.DemoUtilsMessage)
 *
 * @usefont(FontAwesome)
 * @usefont(FontAwesomeBrands)
 * @usefont(FontAwesomeSolid)
 */
qx.Mixin.define("zx.test.MTestsAppThinClient", {
  construct() {
    if (window.parent) {
      qx.log.Logger.register(zx.utils.PostMessageRelayLogger);
    }
  }
});
