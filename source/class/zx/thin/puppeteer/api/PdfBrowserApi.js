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
    super("zx.server.puppeteer.api.PdfServerApi");
  },

  events: {
    /** Fired when the everything is read and the web page should composing the first PDF */
    start: "qx.event.type.Event",

    /** Fired every time a PDF has been successfully taken, and the web page should compose the next PDF or complete */
    next: "qx.event.type.Event"
  },

  members: {
    start() {
      this.fireEvent("start");
    },

    next() {
      this.fireEvent("next");
    },

    /**
     * Tells the puppeteer server to print the PDF
     */
    printPdf(data) {
      this.apiSendEvent("printPdf", data);
    }
  }
});
