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

qx.Class.define("zx.cms.website.UrlRule", {
  extend: zx.io.persistence.Object,
  implement: [zx.io.remote.IProxied],

  construct() {
    super();
    this.setRequiredPermissions(new qx.data.Array());
  },

  properties: {
    /** The URL to match, can be a RegEx string */
    url: {
      check: "String",
      event: "changeUrl",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** Whether the URL is a RegEx string */
    isRegEx: {
      init: false,
      check: "Boolean",
      event: "changeIsRegEx",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** Can the content be cached? */
    cachability: {
      init: null,
      nullable: true,
      check: ["public", "private", "no-store"],
      event: "changeCachability",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** Browser revalidation policy */
    cacheRevalidation: {
      init: null,
      nullable: true,
      check: ["must-revalidate", "immutable"],
      event: "changeCacheRevalidation",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** Max age of the content in seconds */
    maxAge: {
      init: null,
      nullable: true,
      check: "Integer",
      event: "changeMaxAge",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** List of permission names that must be granted to the current user */
    requiredPermissions: {
      check: "qx.data.Array",
      event: "changeRequiredPermissions",
      transform: "_transformRequiredPermissions",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** The action to take if permissions are denied */
    deniedAction: {
      init: "blockNotFound",
      check: ["blockNotFound", "redirectTemporary", "redirectPermanent", "redirectInternally", "custom"],
      event: "changeDeniedAction",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** The Site is able to handle custom actions, this is the identifier for the action to take if permissions are denied */
    deniedCustomActionCode: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeDeniedCustomActionCode",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** Where to redirect to if the `deniedAction` is a redirect */
    deniedRedirectTo: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeDeniedRedirectTo",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** The action to take if permissions are granted */
    grantedAction: {
      init: null,
      nullable: true,
      event: "changeGrantedAction",
      check: ["allow", "redirectTemporary", "redirectPermanent", "redirectInternally", "custom"],
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** The Site is able to handle custom actions, this is the identifier for the action to take if permissions are granted */
    grantedCustomActionCode: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeGrantedCustomActionCode",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** Where to redirect to if the `grantedAction` is a redirect */
    grantedRedirectTo: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeGrantedRedirectTo",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    }
  },

  members: {
    /**
     * Tests whether a given URL matches this UrlRule
     *
     * @param {String} url to match
     * @returns {Boolean}
     */
    matchesUrl(url) {
      if (this.isRegEx()) {
        let regex = new RegExp(this.getUrl());
        return regex.test(url);
      } else {
        return this.getUrl() == url;
      }
    },

    /**
     * Whether the current user is logged in and is granted all required permissions
     *
     * @param {import("fastify").FastifyRequest} req
     * @returns {Boolean}
     */
    async isGranted(req) {
      let user = await zx.server.auth.User.getUserFromSession(req);
      if (!user) {
        return false;
      }
      if (user.hasPermission("zx-super-user")) {
        return true;
      }
      let granted = this.getRequiredPermissions().every(code => user.hasPermission(code));
      return granted;
    },

    /**
     * Whether the current user is denied; if no user is logged in, and there are
     * no required permissions, then this will return `false` because anonymous users
     * are allowed
     *
     * @param {import("fastify").FastifyRequest} req
     * @returns {Boolean}
     */
    async isDenied(req) {
      if (this.getRequiredPermissions().getLength() == 0) {
        return false;
      }
      let user = await zx.server.auth.User.getUserFromSession(req);
      if (!user) {
        return true;
      }
      if (user.hasPermission("zx-super-user")) {
        return false;
      }
      let denied = !this.getRequiredPermissions().every(perm => user.hasPermission(perm));
      return denied;
    },

    /**
     * Transform for `requiredPermissions` property
     */
    _transformRequiredPermissions(value, oldValue) {
      if (oldValue) {
        oldValue.replace(value);
        return oldValue;
      }
      return value;
    }
  }
});
