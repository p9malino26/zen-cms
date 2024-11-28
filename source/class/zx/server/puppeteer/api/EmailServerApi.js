qx.Class.define("zx.server.puppeteer.api.EmailServerApi", {
  //actually the client api!
  extend: zx.io.api.client.AbstractClientApi,
  construct(transport, uri) {
    super(transport, "zx.server.puppeteer.api.EmailApi", ["next"], uri);
  }
});
