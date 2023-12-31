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

qx.Class.define("zx.server.CmsConfiguration", {
  extend: zx.io.persistence.Object,
  implement: [zx.io.remote.IProxied],
  include: [zx.server.MCmsConfiguration],
  "@": new zx.io.remote.anno.Class().set({
    clientMixins: "zx.server.MCmsConfiguration"
  }),

  construct() {
    super();
    this.__registeredApis = {};
  },

  properties: {
    urlPages: {
      check: "zx.app.pages.UrlTreeNavigator",
      event: "changeUrlPages",
      apply: "__applyUrlPages",
      "@": zx.io.remote.anno.Property.DEFAULT
    }
  },

  members: {
    /** @type{zx.server.auth.Security} the security settings */
    __security: null,

    /**
     * @typedef RegisteredApi {Object}
     * @property {String} apiName published name of the API
     * @property {Class} apiClass the class that implements it
     * @property {Function?} check optional function used to check that the user has permission, called with the user object
     * @property {qx.core.Object?} api instance of the API, null until first use
     *
     * @type{Map<String,RegisteredApi} list of registered APIs, indexed by api name */
    __registeredApis: null,

    async initialise() {
      let nav = new zx.app.pages.UrlTreeNavigator();
      await nav.open();
      this.setUrlPages(nav);
    },

    /**
     * Registers an API name; the `apiName` is the well-known name that it is published as, and is often the
     * classname but actually can be anything you like.
     *
     * The function tries to be helpful - if you only pass `apiName`, and it is a string, then it will find a
     * class of that name; if `apiName` is a class, then it will use that class and the `apiName` will be the
     * fully qualified classname.
     *
     * @param {String|Class} apiName published name of the API
     * @param {Class} clazz the class that implements the API
     * @param {Function|String?} check if a string, then it's permission that the user must have, otherwise it
     *  is a function that is called (with the user object as a parameter) and which must return `true` if the user
     *  is allowed access to the API
     */
    registerApi(apiName, clazz, check) {
      let checkFn = check;
      if (typeof check == "string") {
        checkFn = user => user && user.hasPermission(check);
      }
      if (!clazz) {
        if (typeof apiName == "string") {
          clazz = qx.Class.getByName(apiName);
        } else if (typeof apiName.constructor == "function") {
          clazz = apiName;
          apiName = clazz.classname;
        }
      }
      if (qx.core.Environment.get("qx.debug")) {
        if (checkFn) {
          this.assertTrue(typeof checkFn == "function");
        }
      }
      this.__registeredApis[apiName] = {
        apiName,
        apiClass: clazz,
        checkFn,
        api: null
      };
    },

    /**
     * Gets a Page
     *
     * @param {String} url the full url, including the "/pages" prefix for web pages
     * @returns {zx.cms.content.Page}
     */
    "@getPageAtUrl": zx.io.remote.anno.Method.DEFAULT,
    getPageAtUrl(url) {
      let page = zx.server.Standalone.getInstance().getObjectByUrl(zx.cms.content.Page, url);
      return page;
    },

    getSecurity() {},

    /**
     * Gets a named API
     */
    "@getApiImpl": zx.io.remote.anno.Method.DEFAULT,
    async getApiImpl(apiName) {
      let user = await zx.server.auth.User.getUserFromSession();

      let registered = this.__registeredApis[apiName];
      if (registered) {
        if (registered.check && !registered.check(user)) {
          return null;
        }
        if (!registered.api) {
          registered.api = new registered.apiClass();
        }
        return registered.api;
      }

      return null;
    },

    /**
     * Apply for `urlPages`
     */
    __applyUrlPages(value, oldValue) {
      if (oldValue) {
        throw new Error(`Unexpected change of ${this.classname}.urlPages`);
      }
    }
  }
});
