qx.Class.define("zx.demo.remoteapi.PlayerMediaClientApi", {
  extend: zx.io.api.client.AbstractClientApi,
  construct(transport, uri) {
    super(transport, "zx.demo.remoteapi.PlayerMediaApi", ["getCurrentMedia", "playMedia"], uri);
  },
  properties: {},
  objects: {},
  members: {}
});
