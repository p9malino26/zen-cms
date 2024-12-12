qx.Class.define("zx.demo.io.api.PlayerMediaClientApi", {
  extend: zx.io.api.client.AbstractClientApi,
  /**
   * @param {zx.io.api.client.AbstractClientTransport} transport The transport object that this API class sends and receives data
   * @param {string?} uri The URI of the server API. If provided, calls to the server will be forwarded to the API registerd at the path of the URI
   */
  construct(transport, uri) {
    super(transport, "zx.demo.io.api.PlayerMediaApi", ["getCurrentMedia", "playMedia"], uri);
  }
});
