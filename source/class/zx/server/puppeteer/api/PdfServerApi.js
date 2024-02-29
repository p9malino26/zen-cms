qx.Class.define("zx.server.puppeteer.api.PdfServerApi", {
  extend: zx.server.puppeteer.AbstractServerApi,

  construct(puppeteer) {
    super(puppeteer, ["start", "next"]);
  },

  events: {
    printPdf: "qx.event.type.Event",
    complete: "qx.event.type.Data"
  }
});
