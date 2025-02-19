qx.Class.define("zx.server.puppeteer.api.PdfClientApi", {
  extend: zx.io.api.client.AbstractClientApi,
  construct(transport, path) {
    super(transport, "zx.server.puppeteer.api.PdfApi", ["start", "next", "complete"], path);
  }
});
