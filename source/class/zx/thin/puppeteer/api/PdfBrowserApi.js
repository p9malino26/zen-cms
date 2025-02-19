/**
 * API for the browser to create PDFs
 *
 * This class needs to be instantiated in the browser, and then you add code so that when the `start` event
 * is fired, you create the HTML page and call `printPage`
 *
 * When the `next` event is fired, you should either print the next email (via a call to `printPage`) or call
 * `complete` to finish.
 */
qx.Class.define("zx.thin.puppeteer.api.PdfBrowserApi", {
  extend: zx.thin.puppeteer.api.AbstractBrowserApi,

  construct() {
    super("zx.server.puppeteer.api.PdfApi");
  },

  events: {
    /** Fired when the puppeteer client is ready and the web page should composing the first PDF */
    start: "qx.event.type.Event",

    /** Fired every time a PDF has been successfully printed, and the web page should compose the next PDF or complete */
    next: "qx.event.type.Event"
  },

  members: {
    /**
     * @override
     */
    _publications: {
      /**@override */
      complete: null,

      /**
       * @type {*}
       * Fired when the webpage in the browser has been rendered so that the Puppeteer client can print the PDF
       */
      printPdf: {}
    },

    /**
     * REMOTE METHOD
     * Tells page to start rendering the first PDF
     */
    start() {
      this.fireEvent("start");
    },

    /**
     * REMOTE METHOD
     * Tells page to start rendering the next PDF
     */
    next() {
      this.fireEvent("next");
    },

    /**
     * Tells the puppeteer client to print the PDF
     * @param {*} data Custom data regarding what's on the page which will be received by the puppeteer client
     */
    printPdf(data) {
      this.publish("printPdf", data);
    }
  }
});
