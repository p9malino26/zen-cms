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


qx.Class.define("zx.test.io.remote.Person", {
  extend: zx.io.persistence.Object,
  implement: [zx.io.remote.IProxied],
  "@": [zx.io.persistence.anno.Class.DEFAULT, zx.io.remote.anno.Class.NOPROXY],

  construct(name) {
    this.base(arguments);
    if (name) this.setName(name);
    this.setAddress(new zx.test.io.remote.Address());
    this.setSiblings(new qx.data.Array());
    this.setChildren(new qx.data.Array());
    this.setValues(new zx.data.Map());
    this.getChildren().addListener("change", evt => {
      let data = evt.getData();
      if (data.removed) {
        data.removed.forEach(item => item.setParent(null));
      }
      if (data.added) {
        data.added.forEach(item => item.setParent(this));
      }
    });
  },

  properties: {
    name: {
      check: "String",
      event: "changeName",
      "@": zx.io.remote.anno.Property.DEFAULT
    },

    age: {
      init: 0,
      check: "Integer",
      event: "changeAge",
      "@": zx.io.remote.anno.Property.DEFAULT
    },

    address: {
      init: null,
      check: "zx.test.io.remote.Address",
      event: "changeAddress",
      "@": zx.io.remote.anno.Property.DEFAULT
    },

    parent: {
      init: null,
      nullable: true,
      check: "zx.test.io.remote.Person",
      event: "changeParent",
      "@": zx.io.remote.anno.Property.DEFAULT
    },

    values: {
      init: null,
      nullable: true,
      check: "zx.data.Map",
      event: "changeValues",
      "@": [zx.io.remote.anno.Property.EMBED]
    },

    children: {
      check: "qx.data.Array",
      transform: "_transformArray",
      event: "changeChildren",
      "@": [zx.io.remote.anno.Property.EMBED]
    },

    siblings: {
      check: "qx.data.Array",
      transform: "_transformArray",
      event: "changeSiblings",
      "@": [zx.io.remote.anno.Property.EMBED]
    }
  },

  members: {
    _transformArray(value, oldValue) {
      if (!oldValue) oldValue = new qx.data.Array();
      oldValue.replace(value ? value : []);
      return oldValue;
    },

    "@sayHello": zx.io.remote.anno.Method.DEFAULT,
    async sayHello(msg) {
      let place = qx.core.Environment.get("zx.io.remote.NetworkEndpoint.server") ? "SERVER" : "BROWSER";
      let result = `RUNNING ON ${place}: Hello from ${this.getName()}, msg=${msg}`;
      this.info(result);
      return result;
    },

    save() {
      // Nothing - this is here for unit tests to work
    },

    toString() {
      return this.classname + "[" + this.toHashCode() + "]: " + this.getName() + ", age=" + this.getAge();
    }
  }
});
