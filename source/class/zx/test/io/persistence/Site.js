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


qx.Class.define("zx.test.io.persistence.Site", {
  extend: zx.io.persistence.Object,

  properties: {
    /** URL of the page, relative to the website root */
    url: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeUrl",
      "@": zx.io.persistence.anno.Property.DEFAULT
    },

    title: {
      nullable: false,
      check: "String",
      event: "changeTitle",
      "@": [zx.io.persistence.anno.Property.DEFAULT]
    }
  },

  members: {}
});
