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

qx.Mixin.define("zx.server.MCmsConfiguration", {
  construct() {
    this.__apisByName = {};
  },

  members: {
    /** @type{Map<String,qx.core.Object>} Cache of known APIs, indexed by ID */
    __apisByName: null,

    /**
     * Gets an Api by name, caching the result
     *
     * @param {String} apiName
     * @returns {qx.core.Object?} the API, null by default
     */
    async getApi(apiName) {
      let api = this.__apisByName[apiName];
      if (api === undefined) {
        api = this.__apisByName[apiName] = this.getApiImpl(apiName);
      }
      if (qx.Promise.isPromise(api))
        api = await api.then(api => (this.__apisByName[apiName] = api));
      return api;
    }
  }
});
