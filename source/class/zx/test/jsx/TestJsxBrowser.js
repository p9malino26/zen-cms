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

qx.Class.define("zx.test.jsx.TestJsxBrowser", {
  extend: zx.app.demo.Demonstrator,

  members: {
    async testUseNode() {
      let elem = new zx.test.jsx.TestWidget();
      let buffer = "";
      elem.serialize((...args) => (buffer += args.join("")));
      //console.log(buffer);
      this.assertTrue(!elem.getDomElement());

      let dom = document.createElement("div");
      dom.innerHTML = buffer;
      dom = dom.children[0];
      qx.core.Assert.assertTrue(!elem.getDomElement());
      elem.useNode(dom);

      this.assertTrue(dom === elem.getDomElement());
      this.assertTrue(dom.children.length == 2);
      this.assertTrue(dom.children[0].className === "header-class");
      this.assertTrue(dom.children[0] === elem.getQxObject("header").getDomElement());

      this.assertTrue(dom.children[1].className === "body-class");
      this.assertTrue(dom.children[1] === elem.getQxObject("body").getDomElement());

      let domBody = dom.children[1];
      let body = elem.getQxObject("body");
      this.assertTrue(domBody.children.length == 2);
      this.assertTrue(domBody.children[0].innerText === "Label One");
      this.assertTrue(domBody.children[0] === elem.getQxObject("labelOne").getDomElement());

      this.assertTrue(domBody.children[1].innerText === "Label Two");
      this.assertTrue(domBody.children[1] === elem.getQxObject("labelTwo").getDomElement());
    },

    testUseNodeWithExtra() {
      let src = (
        <div data-qx-object-id="root">
          <div className="header-class" data-qx-object-id="root/header">
            <p>This is extra</p>
          </div>
          <div className="body-class" data-qx-object-id="root/body">
            <div data-qx-object-id="root/labelOne">Label One</div>
            <div data-qx-object-id="root/labelTwo">Label Two</div>
          </div>
        </div>
      );

      let buffer = "";
      src.serialize((...args) => (buffer += args.join("")));
      //console.log(buffer);

      let elem = new zx.test.jsx.TestWidget();
      this.assertTrue(!elem.getDomElement());

      let dom = document.createElement("div");
      dom.innerHTML = buffer;
      dom = dom.children[0];
      qx.core.Assert.assertTrue(!elem.getDomElement());
      elem.useNode(dom);

      this.assertTrue(dom === elem.getDomElement());
      this.assertTrue(dom.children.length == 2);
      this.assertTrue(dom.children[0] === elem.getQxObject("header").getDomElement());

      this.assertTrue(dom.children[0].children[0] === elem.getQxObject("header").getChildren()[0].getDomElement());
    }
  }
});
