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

qx.Class.define("zx.test.io.remote.RemoteXhrServer", {
  extend: qx.core.Object,

  construct() {
    this.base(arguments);
    let server = zx.server.Standalone.getInstance();
    let controller = server.getNetworkController();

    this._grandad = new zx.test.io.remote.Person("Arthur").set({ age: 47 });
    this._grandad.addListener("changeAge", evt => {
      this.info("age=" + evt.getData());
    });
    controller.putUriMapping(this.classname + ".grandad", this._grandad);

    controller.putUriMapping(
      this.classname + ".proxyTestOne",
      new zx.test.io.remote.ProxyTestOne()
    );

    this._debbie = new zx.test.io.remote.Person("Debbie");
    this._clarice = new zx.test.io.remote.Person("Clarice");
    this._beverly = new zx.test.io.remote.Person("Beverly");

    this._beverly.getChildren().push(this._clarice);
    this._beverly.getChildren().push(this._debbie);
    this._clarice.getSiblings().push(this._debbie);
    this._debbie.getSiblings().push(this._clarice);
    this._grandad.getChildren().push(this._beverly);

    this._grandad.addListener("changeAge", evt => {
      this.info(`Grandad's age changed to ${evt.getData()}`);
    });
    const traverse = person => {
      person.getChildren().addListener("change", evt => {
        let data = evt.getData();
        (data.removed || []).forEach(item =>
          this.info(person.getName() + ": removed child " + item.getName())
        );
        (data.added || []).forEach(item => {
          this.info(person.getName() + ": added child " + item.getName());
          traverse(item);
        });
      });
      person.getChildren().forEach(traverse);
    };
    traverse(this._grandad);
  },

  members: {}
});
