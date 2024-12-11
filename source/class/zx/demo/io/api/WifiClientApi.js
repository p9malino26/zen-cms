qx.Class.define("zx.demo.io.api.WifiClientApi", {
  extend: zx.io.api.client.AbstractClientApi,
  construct(transport) {
    super(transport, "zx.demo.io.api.WifiApi", ["isOnline"]);
  }
});
