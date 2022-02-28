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

qx.Class.define("zx.server.auth.Permission", {
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
  }
});
