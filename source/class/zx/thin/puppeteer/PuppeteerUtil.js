/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2025 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */

qx.Class.define("zx.thin.puppeteer.PuppeteerUtil", {
  type: "static",
  statics: {
    /**
     * Messages passed between the server and the client
     * are encapsulated in these tags to show they are part of
     * puppeteer remote API calls
     */
    MSG_PREFIX: "[[__ZX_PUPPETEER_START__]]",
    MSG_SUFFIX: "[[__ZX_PUPPETEER_END__]]"
  }
});
