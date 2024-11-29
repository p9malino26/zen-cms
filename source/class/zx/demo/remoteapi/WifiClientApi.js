qx.Class.define("zx.demo.remoteapi.WifiClientApi", {
  extend: zx.io.api.client.AbstractClientApi,
  construct(transport) {
    super(transport, "zx.demo.remoteapi.WifiApi", ["isOnline"]);
  }
});
