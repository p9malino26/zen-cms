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

qx.Class.define("zx.test.io.remote.DemoRemoteXhrClient", {
  extend: zx.app.demo.Demonstrator,

  construct() {
    this.base(arguments);
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
      this.base(arguments);

      let controller = await qx.core.Init.getApplication().getNetController();
      this._grandad = controller.getUriMapping(
        "zx.test.io.remote.RemoteXhrServer.grandad"
      );
    },

    async testSayHello() {
      let age = this._grandad.getAge();
      this._grandad.setAge(age + 1);
      let result = await this._grandad.sayHello("From The Client");
      this.info("Server said: " + result);
      this.assertEquals(
        "RUNNING ON SERVER: Hello from Arthur, msg=From The Client",
        result
      );
      let controller = await qx.core.Init.getApplication().getNetController();
      controller.flush();
    },

    async testChildren() {
      this.assertTrue(!!this._grandad);
      this.assertEquals("Arthur", this._grandad.getName());
      this.assertEquals(1, this._grandad.getChildren().getLength());
      let beverly = this._grandad.getChildren().getItem(0);
      this.assertEquals("Beverly", beverly.getName());
      this.assertEquals(2, beverly.getChildren().getLength());
      let clarice = beverly.getChildren().getItem(0);
      let debbie = beverly.getChildren().getItem(1);
      this.assertEquals("Clarice", clarice.getName());
      this.assertEquals("Debbie", debbie.getName());
      this.assertEquals(1, clarice.getSiblings().getLength());
      this.assertEquals(1, debbie.getSiblings().getLength());
      this.assertTrue(clarice.getSiblings().getItem(0) === debbie);
      this.assertTrue(debbie.getSiblings().getItem(0) === clarice);
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
      return this.base(arguments, id);
    }
  }
});
