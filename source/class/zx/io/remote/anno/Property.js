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
 * Annotation used to indicate properties which can be mirrored across the network.  Properties are
 * not de/serialized by default, so this must be added to all properties
 */
qx.Class.define("zx.io.remote.anno.Property", {
  extend: qx.core.Object,

  properties: {
    /** If true, then an object will be embedded (if derived from qx.core.Object) */
    embed: {
      init: false,
      check: "Boolean"
    },

    /** Override the ClassIo when `embed` is true */
    io: {
      init: null,
      nullable: true,
      check: "zx.io.persistence.ClassIo"
    },

    /** Override the default ClassRefIo instance used to de/serialize this property, when `embed` is false */
    refIo: {
      init: null,
      nullable: true,
      check: "zx.io.persistence.ClassRefIo"
    },

    /** Whether the client is allowed to change this value (ie the server will ignore changes if this is false) */
    clientEditable: {
      init: true,
      check: "Boolean"
    },

    /** Whether the transform property should be ignored */
    excludeTransform: {
      init: false,
      check: "Boolean"
    }
  },

  statics: {
    /** Default settings for including a property in persistence */
    DEFAULT: null,

    /** Server will not allow changes to these objects */
    PROTECTED: null,

    /** Objects derived from `qx.core.Object` will be embedded (as opposed to referenced) */
    EMBED: null
  },

  defer(statics) {
    statics.DEFAULT = new zx.io.remote.anno.Property();
    statics.PROTECTED = new zx.io.remote.anno.Property().set({
      clientEditable: false
    });

    statics.EMBED = new zx.io.remote.anno.Property().set({ embed: true });
  }
});
