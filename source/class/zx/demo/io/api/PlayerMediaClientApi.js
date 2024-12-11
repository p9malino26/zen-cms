qx.Class.define("zx.demo.io.api.PlayerMediaClientApi", {
  extend: zx.io.api.client.AbstractClientApi,
  construct(transport, uri) {
    super(transport, "zx.demo.io.api.PlayerMediaApi", ["getCurrentMedia", "playMedia"], uri);
  },
  properties: {},
  objects: {},
  members: {}
});
