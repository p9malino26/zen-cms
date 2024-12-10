qx.Class.define("zx.server.puppeteer.api.EmailClientApi", {
  extend: zx.io.api.client.AbstractClientApi,
  construct(transport, uri) {
    super(transport, "zx.server.puppeteer.api.EmailApi", ["start", "next"], uri);
  }
});
