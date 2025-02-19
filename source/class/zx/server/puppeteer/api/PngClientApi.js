qx.Class.define("zx.server.puppeteer.api.PngClientApi", {
  extend: zx.io.api.client.AbstractClientApi,
  construct(transport, path) {
    super(transport, "zx.server.puppeteer.api.PngApi", ["start", "next", "complete"], path);
  }
});
