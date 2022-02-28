/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2022 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */


/**
 * Provides a wrapper for remote API calls - see RestApiClientBrowser and RestApiClientNode
 *
 * Given the name of an API and an array of method definitions, this generates an object
 * where the methods are created as first-class objects of `this` - for example, if the
 * API name is `"loginApi"` and the methods are `[ "login", "logout" ]`, then you can
 * call `this.login()`.
 *
 * Each element of the array of method definitions can be either a string (in which case
 * it is the name of the function at the server and at the browser, and GET is used to call
 * the server) or a map with more detailed options:
 *
 * @type method {String?} HTTP method, default is GET but you could also choose POST etc
 * @type remoteName {String?} name of the remote function, default is the browser name
 *
 * Each created function takes two parameters:
 *  @type params {Map?} a map of values to be passed in the query of the AJAX request
 *  @type data {Object?} a POJO of values to be serialized and posted as the body of the request
 *
 * The function returns a `qx.Promise` with the result of the function returned by the server
 */
qx.Class.define("zx.thin.api.AbstractRestApiClient", {
  extend: qx.core.Object,

  /**
   * Constructor
   *
   * @param apiName {String} the name of the API
   * @param methods {String[]|Map?} the methods to implement
   */
  construct(apiName, methods) {
    this.base(arguments);
    this._apiName = apiName;

    if (methods) {
      const install = (httpMethod, localName, remoteName) => {
        this[localName] = (...args) =>
          this._callApi(httpMethod, remoteName, ...args);
      };
      Object.keys(methods).forEach(localName => {
        let value = methods[localName];
        if (typeof value == "string") value = { method: value };
        let remoteName = value.remoteName || localName;
        install(value.method || "GET", localName, remoteName);
      });
    }
  },

  properties: {
    /** The prefix for all API calls */
    endPoint: {
      init: "/zx/api/v1/",
      nullable: false,
      check: "String"
    },

    /**
     * The base URL to connect to (not needed for browser if connecting to
     * the same origin as the current page)
     */
    baseUrl: {
      init: null,
      nullable: true,
      check: "String"
    }
  },

  members: {
    _apiName: null,

    /**
     * Implementation of created methods
     *
     * @param httpMethod {String} HTTP method (eg GET)
     * @param remoteName {String} method name
     * @param params {Map?} map of query values for the URL
     * @param data {Object?} data to send as the body
     * @param cookieStore {tough-cookie.Store?}
     * @return {Object?} whatever the function returns, parsed as JSON
     */
    async _callApi(httpMethod, remoteName, params, body, cookieStore) {
      let url = this.getEndpoint() + this._apiName + "/" + remoteName;
      if (params) {
        if (qx.lang.Type.isArray(params)) {
          url += "?" + params.map(str => encodeURIComponent(str)).join("&");
        } else if (typeof params == "string")
          url += "?" + encodeURIComponent(params);
        else if (qx.lang.Type.isObject(params)) {
          url +=
            "?" +
            Object.keys(params)
              .map(key => {
                let value = params[str];
                if (value !== null && value !== undefined)
                  return key + "=" + encodeURIComponent(value);
                return key;
              })
              .join("&");
        }
      }
      let baseUrl = this.getBaseUrl();
      if (baseUrl) url = baseUrl + url;

      return await new qx.Promise((resolve, reject) => {
        this._callApiImpl(
          httpMethod,
          url,
          body,
          cookieStore,
          data => {
            if (data.status == "ok") resolve(data.result);
            else if (data.status == "error")
              reject(
                zx.cms.util.Error.create(
                  data.message || "An unknown error was reported by the server"
                )
              );
            else
              reject(
                zx.cms.util.Error.create(
                  "An unrecognised status '${data.status}' was reported by the server"
                )
              );
          },
          err => {
            reject(
              zx.cms.util.Error.create(
                `API: ${httpMethod} ${this._apiName}.${remoteName} failed (${err})`,
                { params, body }
              )
            );
          }
        );
      });
    },

    _callApiImpl(httpMethod, url, body, cookieStore, onSuccess, onError) {
      throw new Error(
        "No implementation for " + this.classname + "._callApiImpl"
      );
    }
  }
});
