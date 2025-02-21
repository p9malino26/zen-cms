/**
 * Generic server API proxy, can be used for any API that is defined by an interface
 */
qx.Class.define("zx.io.api.server.GenericServerApiProxy", {
  extend: zx.io.api.server.AbstractServerApi,

  /**
   * Constructor.  `apiInterface` must conform to the name `package.IName`, and `apiImplementation`
   * must implement that interface
   *
   * @param {Interface} apiInterface
   * @param {qx.core.Object<implements apiInterface>} apiImplementation
   */
  construct(apiInterface, apiImplementation) {
    super(zx.io.api.ApiUtils.getApiNameFromInterface(apiInterface));
    let methodNames = zx.io.api.ApiUtils.getMethodNamesFromInterface(apiInterface);
    for (let methodName of methodNames) {
      this[methodName] = async (...args) => await apiImplementation[methodName](...args);
      this._registerGet(methodName, this[methodName]);
    }
    if (apiInterface.$$members._publications) {
      this._publications = apiInterface.$$members._publications;
    }
  }
});
