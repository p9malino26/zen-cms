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

qx.Class.define("zx.ui.editor.SubEntity", {
  extend: qx.core.Object,

  construct(object) {
    this.base(arguments);
    this.__object = object;
    this.__bindIds = [];
    this.initModified();
  },

  properties: {
    modified: {
      init: false,
      check: "Boolean",
      event: "changeModified"
    }
  },

  members: {
    __object: null,
    __count: 0,
    __bindIds: null,

    incRef() {
      if (this.__count === 0)
        zx.ui.editor.SubEntity.__entities[this.__object.toHashCode()] = this;
      this.__count++;
    },

    decRef() {
      if (qx.core.Environment.get("qx.debug"))
        this.assertTrue(this.__count > 0);
      this.__count--;
      if (this.__count === 0)
        delete zx.ui.editor.SubEntity.__entities[this.__object.toHashCode()];
    },

    getCount() {
      return this.__count;
    },

    getObject() {
      return this.__object;
    },

    toString() {
      return "SubEntity: " + this.__object;
    }
  },

  statics: {
    __entities: {},

    getEntity(object, create) {
      let hash = object.toHashCode();
      let ref = this.__entities[hash];
      if (!ref && create) ref = new zx.ui.editor.SubEntity(object);
      return ref;
    }
  }
});
