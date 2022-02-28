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
 * Annotation used to indicate properties which cause the lastModified property
 * to be updated (requires the zx.server.MObjectLastModified mixin)
 */
qx.Class.define("zx.server.anno.LastModified", {
  extend: qx.core.Object,

  properties: {
    /** Whether excluded from the default */
    excluded: {
      init: false,
      check: "Boolean"
    },

    /** The property name to use, defaults to `lastModified` if null */
    name: {
      init: null,
      nullable: true,
      check: "String"
    }
  },

  statics: {
    /** Default settings  */
    DEFAULT: null,

    /** Exclude from last modified used when the default for the class is to update last modified) */
    EXCLUDED: null
  },

  defer(statics) {
    statics.DEFAULT = new zx.server.anno.LastModified();
    statics.EXCLUDED = new zx.server.anno.LastModified().set({
      excluded: true
    });
  }
});
