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
 * Annotation used to adjust persistence of classes; it is not necessary to add this
 * to classes because all classes can be de/serialized by default, this annotation is
 * used to adjust the de/serialisation (eg specify own ClassIo and ClassRefIo instances)
 */
qx.Class.define("zx.io.persistence.anno.Class", {
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
    }
  }
});
