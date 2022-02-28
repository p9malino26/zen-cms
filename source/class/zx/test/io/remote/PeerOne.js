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
 * @use(zx.app.demo.DemonstratorProxy)
 */
qx.Class.define("zx.test.io.remote.PeerOne", {
  extend: zx.test.io.remote.AbstractPeerApp,

  members: {
    async initPeer(root) {
      // Controller manages the objects and their serialisation
      let ctlr = (this._controller = new zx.io.remote.NetworkController());

      // Listener is specific to a given platform (postMessage, Xhr, etc)
      new zx.io.remote.WindowListener(ctlr);

      /*
       * Create iframe to contain PeerTwo
       */
      let uri = document.location.pathname;
      if (uri.endsWith("/index.html")) uri = uri.substring(0, uri.length - 11);
      if (uri.endsWith("/")) uri = uri.substring(0, uri.length - 11);
      let pos = uri.lastIndexOf("/");
      uri = uri.substring(0, pos + 1) + "peertwo/index.html";
      // let uri = "/tests/io/remote/demo-thin-peer-two.html";
      let iframe = new qx.ui.embed.Iframe(uri).set({
        padding: 40
      });
      root.add(iframe, { flex: 1 });

      /*
       * Create data model to share with PeerTwo
       */
      let grandad = new zx.test.io.remote.Person("Arthur").set({ age: 47 });
      let beverly = new zx.test.io.remote.Person("Beverly");
      let clarice = new zx.test.io.remote.Person("Clarice");
      let debbie = new zx.test.io.remote.Person("Debbie");
      beverly.getChildren().push(clarice);
      beverly.getChildren().push(debbie);
      clarice.getSiblings().push(debbie);
      debbie.getSiblings().push(clarice);
      grandad.getChildren().push(beverly);

      ctlr.putUriMapping("grandad", grandad);

      this.initGrandad(grandad);

      this.log("Timing createUuid");
      let start = performance.now();
      for (let i = 0; i < 100000; i++) {
        qx.util.Uuid.createUuidV4();
      }
      let elapsed = performance.now() - start;
      this.log("Created 100,000 UUIDv4 in " + elapsed + "ms");
    }
  }
});
