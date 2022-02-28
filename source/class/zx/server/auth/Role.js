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

qx.Class.define("zx.server.auth.Role", {
  extend: zx.server.Object,
  implement: [zx.io.remote.IProxied],
  "@": [zx.io.remote.anno.Class.NOPROXY],

  properties: {
    /** ShortCode should be alphanumeric - no spaces or punctuation except hyphen or underscore */
    shortCode: {
      init: "",
      nullable: false,
      check: "String",
      event: "changeShortCode",
      "@": [
        zx.io.persistence.anno.Property.DEFAULT,
        zx.io.remote.anno.Property.DEFAULT
      ]
    },

    /** Human readable title */
    title: {
      init: "",
      nullable: false,
      check: "String",
      event: "changeTitle",
      "@": [
        zx.io.persistence.anno.Property.DEFAULT,
        zx.io.remote.anno.Property.DEFAULT
      ]
    },

    /** List of permissions in this role */
    permissions: {
      init: null,
      nullable: true,
      check: "zx.data.IndexedArray",
      event: "changePermissions",
      transform: "_transformPermissions",
      "@": [
        zx.io.persistence.anno.Property.DEFAULT,
        zx.io.remote.anno.Property.DEFAULT
      ]
    },

    /** Notes for the user */
    notes: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeNotes",
      "@": [
        zx.io.persistence.anno.Property.DEFAULT,
        zx.io.remote.anno.Property.DEFAULT
      ]
    }
  },

  members: {
    /**
     * Transform for `permissions`
     */
    _transformPermissions(value, oldValue) {
      if (!oldValue) return value;
      oldValue.replace(value || []);
      return oldValue;
    },

    /**
     * Detects whether this role has a given permission
     *
     * @param {String} shortCode
     * @returns
     */
    hasPermission(shortCode) {
      if (shortCode instanceof zx.server.auth.Permission)
        shortCode = shortCode.getShortCode();
      return !this.getPermissions().find(
        perm => perm.getShortCode() == shortCode
      );
    }
  }
});
