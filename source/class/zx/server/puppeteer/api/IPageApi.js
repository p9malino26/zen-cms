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

/**
 * API for working with web pages; this allows the caller to start the page, iterate through states in that page, and
 * complete the process.
 *
 * For example, when `start` has called, the page should render the first page.  It will fire a `pageReady` event when it
 * is completely loaded, and the caller might (eg) render a PNG or save a PDF.  When `next` is called, the page should
 * go to the next state (eg the next set of data) if there is any, and the page will fire `pageReady` again.
 *
 * When there are no more page states to render, the `complete` event is fired.
 *
 * When the caller is done with the page, it should call `complete` to shut down the browser.
 */
qx.Interface.define("zx.server.puppeteer.api.IPageApi", {
  members: {
    /** @override */
    _publications: {
      /**
       * Fired when the page is ready and the page is fully rendered
       */
      pageReady: true,

      /**
       * Fired when we are done with the browser and can shut it down
       */
      complete: true
    },

    /**
     * Tells page to start rendering the first page
     */
    start() {},

    /**
     * Tells page to render the next page
     */
    next() {},

    /**
     * Call this when we are done with the browser and can shut it down
     */
    complete() {}
  }
});
