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

qx.Class.define("zx.test.io.remote.ProxyTestOne", {
  extend: zx.io.persistence.Object,
  implement: [zx.io.remote.IProxied],
  "@": new zx.io.remote.anno.Class().set({
    clientMixins: "zx.test.io.remote.MProxyTestOne"
  }),

  properties: {
    name: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeName",
      "@": zx.io.remote.anno.Property.DEFAULT
    }
  },

  members: {
    "@sayHello": zx.io.remote.anno.Method.DEFAULT,
    async sayHello(msg) {
      let place = qx.core.Environment.get("zx.io.remote.NetworkEndpoint.server")
        ? "SERVER"
        : "BROWSER";
      let result = `RUNNING ON ${place}: Hello from ${this.getName()}, msg=${msg}`;
      console.log(result);
      return result;
    }
  }
});
