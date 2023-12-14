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

qx.Class.define("zx.io.persistence.ClassIos", {
  extend: qx.core.Object,
  type: "abstract",

  construct(annoClass, annoProperty, annoArray, annoMap) {
    super();
    this.annoClass = annoClass;
    this.annoProperty = annoProperty;
    this.annoArray = annoArray;
    this.annoMap = annoMap;
    this.__classIos = {};
    this.__refIos = {};
  },

  members: {
    annoClass: null,
    annoProperty: null,
    annoArray: null,
    annoMap: null,

    __classIos: null,
    __refIos: null,

    /**
     * Registers the class for persisting references to qx.core.Object instances; this can be
     * overridden using annotations, but if specified manually this will override any annotations
     * on the actual class
     *
     * @param io {ClassIo} the [de]serializer
     */
    registerClassIo(io, suppressWarnings) {
      let classname = io.getClass().classname;
      if (this.__classIos[classname]) {
        if (!suppressWarnings) {
          this.warn(`Replacing default ClassIo for ${classname}`);
        }
      }
      this.__classIos[classname] = io;
    },

    /**
     * Gets the default class for persisting references to qx.core.Object instances
     *
     * @return {ClassIo} the [de]serializer
     */
    getClassIo(clazz) {
      if (typeof clazz == "string") {
        clazz = qx.Class.getByName(clazz);
      }

      // No classname means its probably a native class
      if (!clazz.classname) {
        return null;
      }

      let io = this.__classIos[clazz.classname];
      if (!io) {
        let classAnnos = qx.Annotation.getClass(clazz, this.annoClass);
        for (let i = classAnnos.length - 1; i >= 0; i--) {
          io = classAnnos[i].getIo();
          if (io != null) {
            break;
          }
        }
      }
      if (!io) {
        io = this.__classIos[clazz.classname] = new zx.io.persistence.ClassIo(this, clazz);
      }
      return io;
    },

    /**
     * Detects whether the object is persistable
     * @param {*} obj
     * @returns
     */
    isCompatibleObject(obj) {
      if (!obj || !(obj instanceof qx.core.Object) || !qx.Class.hasInterface(obj.constructor, zx.io.persistence.IObject)) {
        return false;
      }

      return !!this.getClassIo(obj.constructor);
    },

    /**
     * Registers the default class for persisting references to qx.core.Object instances
     *
     * @param refio {ClassRefIo} the [de]serializer
     */
    registerDefaultRefIo(refio, suppressWarnings) {
      let classname = refio.getClass().classname;
      if (this.__refIos[classname]) {
        if (!suppressWarnings) {
          this.warn(`Replacing default ClassRefIo for ${classname}`);
        }
      }
      this.__refIos[classname] = refio;
    },

    /**
     * Gets the default class for persisting references to qx.core.Object instances
     *
     * @return {ClassRefIo} the [de]serializer
     */
    getDefaultRefIo(clazz) {
      if (typeof clazz == "string") {
        clazz = qx.Class.getByName(clazz);
      }
      let io = this.__refIos[clazz.classname] || null;
      if (!io) {
        let classAnnos = qx.Annotation.getClass(clazz, this.annoClass);
        for (let i = classAnnos.length - 1; i >= 0; i--) {
          io = classAnnos[i].getRefIo();
          if (io != null) {
            break;
          }
        }
      }
      if (!io && qx.Class.isSubClassOf(clazz, qx.core.Object)) {
        throw new Error(`Cannot reference instance of ${clazz} because it is a Qooxdoo class but which does not support persistence`);
      }
      return io;
    }
  }
});
