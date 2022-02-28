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

qx.Class.define("zx.app.pages.UrlNode", {
  extend: zx.io.persistence.Object,
  implement: [zx.io.remote.IProxied],
  include: [zx.app.pages.MUrlNode],

  "@": new zx.io.remote.anno.Class().set({
    clientMixins: "zx.app.pages.MUrlNode",
    refIo: new zx.io.persistence.ClassRefIo()
  }),

  properties: {
    /** Name of this node (ie the bit between '/' in the URL) */
    name: {
      nullable: false,
      check: "String",
      event: "changeName",
      apply: "_applyName",
      "@": zx.io.remote.anno.Property.DEFAULT
    },

    /** The UUID of the document that this node is for */
    uuid: {
      nullable: false,
      check: "String",
      event: "changeUuid",
      "@": zx.io.remote.anno.Property.DEFAULT
    },

    /** Parent node, null if this is the root node */
    parent: {
      init: null,
      nullable: true,
      check: "zx.io.persistence.Object",
      event: "changeParent",
      "@": zx.io.remote.anno.Property.DEFAULT
    },

    /** Child nodes */
    children: {
      check: "qx.data.Array",
      transform: "_transformChildren",
      event: "changeChildren",
      "@": zx.io.remote.anno.Property.DEFAULT
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
    },

    /**
     * Apply method for `name`
     */
    _applyName(value) {}
  }
});
