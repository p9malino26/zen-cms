qx.Class.define("zx.server.puppeteer.api.HeadlessPageClientApi", {
  extend: zx.io.api.client.AbstractClientApi,
  construct(transport, uri) {
    super(transport, "zx.server.puppeteer.api.HeadlessPageApi", ["waitForServer", "run"], uri);
  }
});
