/**
 * This proxy class is generated by `zx.io.remote.proxy.ClassWriter` and should not be edited manually
 * because it will be overwritten.
 *
 * To regenerate, use `zx create-proxies`, and the CMS server will automatically do the same during startup.
 *
 * Copyright and License - this file is copyright and licensed under the terms provided by the copyright owner, 
 * which presumably match the owner and license terms of the original source file.  It is your responsibility 
 * to determine ownership and terms.
 *

  
 * @use(qx.data.Array)
  


  
 * @require(zx.io.persistence.anno.Property)
  
 * @require(zx.io.remote.anno.Property)
  

 */
qx.Class.define("zx.cms.website.UrlRule", {
  extend: zx.io.persistence.Object,

  construct(...vargs) {
    this.base(arguments, ...vargs);
    zx.io.remote.NetworkEndpoint.initialiseRemoteClass(zx.cms.website.UrlRule);
  },

  properties: {
    url: {
      check: "String",
      nullable: false,
      event: "changeUrl",
      apply: "_applyUrl",

      "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property()]
    },

    isRegEx: {
      init: false,

      check: "Boolean",
      nullable: false,
      event: "changeIsRegEx",
      apply: "_applyIsRegEx",

      "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property()]
    },

    cachability: {
      init: null,

      check: ["public", "private", "no-store"],
      nullable: true,
      event: "changeCachability",
      apply: "_applyCachability",

      "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property()]
    },

    cacheRevalidation: {
      init: null,

      check: ["must-revalidate", "immutable"],
      nullable: true,
      event: "changeCacheRevalidation",
      apply: "_applyCacheRevalidation",

      "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property()]
    },

    maxAge: {
      init: null,

      check: "Integer",
      nullable: true,
      event: "changeMaxAge",
      apply: "_applyMaxAge",

      "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property()]
    },

    requiredPermissions: {
      check: "qx.data.Array",
      nullable: false,
      event: "changeRequiredPermissions",
      apply: "_applyRequiredPermissions",
      transform: "_transformRequiredPermissions",

      "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property()]
    },

    deniedAction: {
      init: "blockNotFound",

      check: ["blockNotFound", "redirectTemporary", "redirectPermanent", "redirectInternally", "custom"],
      nullable: false,
      event: "changeDeniedAction",
      apply: "_applyDeniedAction",

      "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property()]
    },

    deniedCustomActionCode: {
      init: null,

      check: "String",
      nullable: true,
      event: "changeDeniedCustomActionCode",
      apply: "_applyDeniedCustomActionCode",

      "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property()]
    },

    deniedRedirectTo: {
      init: null,

      check: "String",
      nullable: true,
      event: "changeDeniedRedirectTo",
      apply: "_applyDeniedRedirectTo",

      "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property()]
    },

    grantedAction: {
      init: null,

      check: ["allow", "redirectTemporary", "redirectPermanent", "redirectInternally", "custom"],
      nullable: true,
      event: "changeGrantedAction",
      apply: "_applyGrantedAction",

      "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property()]
    },

    grantedCustomActionCode: {
      init: null,

      check: "String",
      nullable: true,
      event: "changeGrantedCustomActionCode",
      apply: "_applyGrantedCustomActionCode",

      "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property()]
    },

    grantedRedirectTo: {
      init: null,

      check: "String",
      nullable: true,
      event: "changeGrantedRedirectTo",
      apply: "_applyGrantedRedirectTo",

      "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property()]
    }
  },

  members: {
    _applyUrl(value, oldValue) {
      // Nothing - to be overridden
    },

    _applyIsRegEx(value, oldValue) {
      // Nothing - to be overridden
    },

    _applyCachability(value, oldValue) {
      // Nothing - to be overridden
    },

    _applyCacheRevalidation(value, oldValue) {
      // Nothing - to be overridden
    },

    _applyMaxAge(value, oldValue) {
      // Nothing - to be overridden
    },

    _applyRequiredPermissions(value, oldValue) {
      // Nothing - to be overridden
    },

    _applyDeniedAction(value, oldValue) {
      // Nothing - to be overridden
    },

    _applyDeniedCustomActionCode(value, oldValue) {
      // Nothing - to be overridden
    },

    _applyDeniedRedirectTo(value, oldValue) {
      // Nothing - to be overridden
    },

    _applyGrantedAction(value, oldValue) {
      // Nothing - to be overridden
    },

    _applyGrantedCustomActionCode(value, oldValue) {
      // Nothing - to be overridden
    },

    _applyGrantedRedirectTo(value, oldValue) {
      // Nothing - to be overridden
    },

    _transformRequiredPermissions(value, oldValue) {
      if (oldValue) {
        oldValue.replace(value);
        return oldValue;
      }

      return value;
    }
  }
});
