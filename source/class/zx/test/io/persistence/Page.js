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
 * Demo class for persistence tests
 */
qx.Class.define("zx.test.io.persistence.Page", {
  extend: zx.io.persistence.Object,

  construct() {
    super();
    this.setPieces(new qx.data.Array());
    this.setValues(new zx.data.Map());
  },

  properties: {
    /** Title of the page */
    title: {
      init: "Untitled Page",
      check: "String",
      event: "changeTitle",
      "@": zx.io.persistence.anno.Property.DEFAULT
    },

    /** URL of the page, relative to the website root */
    url: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeUrl",
      "@": zx.io.persistence.anno.Property.DEFAULT
    },

    /** Last modified date */
    lastModified: {
      init: null,
      nullable: true,
      check: "Date",
      "@": zx.io.persistence.anno.Property.DEFAULT
    },

    /** Pieces in the Page */
    pieces: {
      nullable: false,
      check: "qx.data.Array",
      transform: "__transformPieces",
      "@": [
        zx.io.persistence.anno.Property.EMBED,
        new zx.io.persistence.anno.Array().set({
          arrayType: zx.test.io.persistence.Piece
        })
      ]
    },

    values: {
      init: null,
      nullable: true,
      check: "zx.data.Map",
      event: "changeValues",
      "@": [zx.io.remote.anno.Property.EMBED]
    }
  },

  members: {
    __transformPieces(value, oldValue) {
      if (oldValue) {
        oldValue.replace(value ? value : []);
        return oldValue;
      }
      return value;
    }
  }
});
