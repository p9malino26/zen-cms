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

qx.Class.define("zx.test.io.remote.Address", {
  extend: zx.io.persistence.Object,
  implement: [zx.io.remote.IProxied],
  "@": [zx.io.persistence.anno.Class.DEFAULT, zx.io.remote.anno.Class.NOPROXY],

  construct(name) {
    super();
  },

  properties: {
    line1: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeLine1",
      "@": zx.io.remote.anno.Property.DEFAULT
    },

    line2: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeLine2",
      "@": zx.io.remote.anno.Property.DEFAULT
    },

    city: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeCity",
      "@": zx.io.remote.anno.Property.DEFAULT
    },

    postcode: {
      init: null,
      nullable: true,
      check: "String",
      event: "changePostcode",
      "@": zx.io.remote.anno.Property.DEFAULT
    }
  },

  members: {}
});
