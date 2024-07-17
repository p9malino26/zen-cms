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
 * Annotation used to indicate methods which can be called remotely
 */
qx.Class.define("zx.io.remote.anno.Class", {
  extend: qx.core.Object,

  properties: {
    /** Specify the default class used to de/serialize references to instances of this class */
    refIo: {
      init: null,
      nullable: true,
      check: "zx.io.persistence.ClassRefIo"
    },

    /** Specify the default class used to de/serialize instances of this class */
    io: {
      init: null,
      nullable: true,
      check: "zx.io.persistence.ClassIo"
    },

    /** @type{String|String[]} mixins for the generated client class */
    clientMixins: {
      init: null,
      nullable: true
    },

    /** If "never", then this class is not rewritten as a proxy for the client, instead it is loaded
     * in the client through normal dependency injection and the code is the same on client and server;
     * if "always" then a proxy will be generated */
    proxy: {
      init: "always",
      check: ["never", "always"],
      nullable: false
    }
  },

  statics: {
    DEFAULT: null,
    NOPROXY: null
  },

  defer(statics) {
    statics.DEFAULT = new zx.io.remote.anno.Class().set({
      refIo: new zx.io.persistence.ClassRefIo()
    });

    statics.NOPROXY = new zx.io.remote.anno.Class().set({
      refIo: new zx.io.persistence.ClassRefIo(),
      proxy: "never"
    });
  }
});
