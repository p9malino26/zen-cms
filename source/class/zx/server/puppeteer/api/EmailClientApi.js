qx.Class.define("zx.server.puppeteer.api.EmailClientApi", {
  extend: zx.io.api.client.AbstractClientApi,
  construct(transport, path) {
    super(transport, "zx.server.puppeteer.api.EmailApi", ["start", "next"], path);
  }
});
