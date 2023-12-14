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

qx.Class.define("zx.cms.website.NavItem", {
  extend: zx.io.persistence.Object,
  implement: [zx.io.remote.IProxied],

  construct() {
    super();
    this.setChildren(new qx.data.Array());
  },

  properties: {
    url: {
      check: "String",
      event: "changeUrl",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    title: {
      check: "String",
      event: "changeTitle",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** CSS Class to apply */
    cssClass: {
      init: "",
      check: "String",
      event: "changeCssClass",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** Child NavItems */
    children: {
      check: "qx.data.Array",
      transform: "_transformChildren",
      event: "changeChildren",
      "@": [zx.io.persistence.anno.Property.EMBED, zx.io.remote.anno.Property.DEFAULT]
    }
  },

  members: {
    /**
     * Transform for `children` property
     */
    _transformChildren(value, oldValue) {
      if (oldValue) {
        oldValue.replace(value);
        return oldValue;
      }
      return value;
    }
  }
});
