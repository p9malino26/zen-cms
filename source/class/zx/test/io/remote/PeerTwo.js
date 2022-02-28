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
 * @use(zx.test.io.remote.Person)
 */
qx.Class.define("zx.test.io.remote.PeerTwo", {
  extend: zx.test.io.remote.AbstractPeerApp,

  members: {
    async initPeer(root) {
      // Controller manages the objects and their serialisation across the DataSource
      let ctlr = (this._controller = new zx.io.remote.NetworkController());

      // Connect to the parent window because we know that we are in an iframe created by PeerOne
      let endpoint = new zx.io.remote.WindowEndpoint(window.parent);
      ctlr.addEndpoint(endpoint);
      await endpoint.open();

      let grandad = ctlr.getUriMapping("grandad");
      this.initGrandad(grandad);
    },

    async initGrandad(grandad) {
      await this.base(arguments, grandad);

      let A = qx.core.Assert;

      A.assertTrue(!!grandad);
      A.assertEquals("Arthur", grandad.getName());
      A.assertEquals(1, grandad.getChildren().getLength());
      let beverly = grandad.getChildren().getItem(0);
      A.assertEquals("Beverly", beverly.getName());
      A.assertEquals(2, beverly.getChildren().getLength());
      let clarice = beverly.getChildren().getItem(0);
      let debbie = beverly.getChildren().getItem(1);
      A.assertEquals("Clarice", clarice.getName());
      A.assertEquals("Debbie", debbie.getName());
      A.assertEquals(1, clarice.getSiblings().getLength());
      A.assertEquals(1, debbie.getSiblings().getLength());
      A.assertTrue(clarice.getSiblings().getItem(0) === debbie);
      A.assertTrue(debbie.getSiblings().getItem(0) === clarice);
    }
  }
});
