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

qx.Class.define("zx.test.io.remote.DemoProxyClient", {
  extend: zx.app.demo.Demonstrator,

  construct() {
    super();
    this._captureLogs(this.__url);
  },

  members: {
    __url: "/tests/io/remote/demo-thin-xhr.html",

    /**
     * @Override
     */
    _supportsReset: true,

    /**
     * @Override
     */
    _createUiRoot() {
      return this.getQxObject("root");
    },

    /**
     * @Override
     */
    async resetDemo() {
      await this.initialise();
    },

    /**
     * @Override
     */
    async initialise() {
      super.initialise();
      let controller = await qx.core.Init.getApplication().getNetController();

      this._proxyTestOne = controller.getUriMapping("zx.test.io.remote.RemoteXhrServer.proxyTestOne");

      this._proxyTestOne.setName("Proxy Test One");
    },

    async testSayHello() {
      let controller = await qx.core.Init.getApplication().getNetController();
      let result = await this._proxyTestOne.sayHello("From The Client");
      this.info("Server said: " + result);
      this.assertEquals("RUNNING ON SERVER: Hello from Proxy Test One, msg=From The Client", result);

      this._proxyTestOne.setName("My New Name");
      result = await this._proxyTestOne.sayHello("From The Client");
      this.info("Server said: " + result);
      this.assertEquals("RUNNING ON SERVER: Hello from My New Name, msg=From The Client", result);

      this.assertEquals("blah", this._proxyTestOne.blahDeBlah());
      controller.flush();
    },

    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "root":
          var comp = new qx.ui.container.Composite(new qx.ui.layout.VBox());
          //comp.add(this.getQxObject("toolbar"));
          comp.add(this.getQxObject("iframe"), { flex: 1 });
          return comp;

        case "iframe":
          var iframe = new qx.ui.embed.Iframe(this.__url);
          this.log("Page source is " + this.__url);
          return iframe;
      }

      return super._createQxObjectImpl(id);
    }
  }
});
