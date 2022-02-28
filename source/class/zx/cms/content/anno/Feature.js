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
 * Annotation used to specify the Feature for a given class, and/or control it's behaviour
 */
qx.Class.define("zx.cms.content.anno.Feature", {
  extend: qx.core.Object,

  properties: {
    supportsServerRender: {
      init: true,
      check: "Boolean"
    },

    featureClass: {
      init: null,
      nullable: true,
      check: "String"
    },

    serverRender: {
      init: null,
      nullable: true,
      check: "Class"
    },

    clientInstaller: {
      init: null,
      nullable: true,
      check: "Class"
    }
  },

  statics: {
    SIMPLE: null
  },

  defer(statics) {
    statics.SIMPLE = new zx.cms.content.anno.Feature();
  }
});
