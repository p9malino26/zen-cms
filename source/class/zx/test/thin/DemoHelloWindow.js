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

qx.Class.define("zx.test.thin.DemoHelloWindow", {
  extend: zx.thin.ui.container.Window,

  "@": new zx.cms.content.anno.Feature().set({
    featureClass: zx.test.thin.DemoHelloWindowFeature.classname
  }),

  construct() {
    super();
    this.setCaption("Hello World Window");
    let body = this.getBody();
    body.add(this.getQxObject("bodyHeading"));
    body.add(this.getQxObject("paraOne"));
    this.setCentered("both");
  },

  members: {
    runUseNodeTests(domClone) {
      function clear(node) {
        node.removeAttribute("data-qx-object-id");
        qx.lang.Array.fromCollection(node.children).forEach(clear);
      }
      clear(domClone);
      this.assertTrue(domClone.innerHTML === this.getDomElement().innerHTML);
    },

    _createQxObjectImpl(id) {
      switch (id) {
        case "bodyHeading":
          return <h2>Hello Body Heading</h2>;

        case "paraOne":
          return <p>This is para One </p>;
      }

      return super._createQxObjectImpl(id);
    }
  }
});
