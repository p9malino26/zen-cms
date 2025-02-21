/**
 * Generic client API proxy, can be used for any API that is defined by an interface
 */
qx.Class.define("zx.io.api.client.GenericClientApiProxy", {
  extend: zx.io.api.server.AbstractClientApi,

  /**
   * Constructor.  `apiInterface` must conform to the name `package.IName`, and `apiImplementation`
   * must implement that interface
   *
   * @param {Interface} apiInterface
   * @param {zx.io.api.client.AbstractClientTransport} transport
   * @param {String} path
   */
  construct(apiInterface, transport, path) {
    super(transport, zx.io.api.ApiUtils.getApiNameFromInterface(apiInterface), zx.io.api.ApiUtils.getMethodNamesFromInterface(apiInterface), path);
  }
});
