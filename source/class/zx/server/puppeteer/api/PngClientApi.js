qx.Class.define("zx.server.puppeteer.api.PngClientApi", {
  extend: zx.io.api.client.AbstractClientApi,
  construct(transport, uri) {
    super(transport, "zx.server.puppeteer.api.PngApi", ["start", "next", "complete"], uri);
  }
});
