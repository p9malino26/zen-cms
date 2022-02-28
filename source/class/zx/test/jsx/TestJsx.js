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


qx.Class.define("zx.test.jsx.TestJsx", {
  extend: zx.app.demo.Demonstrator,

  members: {
    async testBasics() {
      let html = (
        <div id="el1">
          Hello
          <div id="el2" className="hello" style="border: 1px solid" /> World
        </div>
      );
      this.assertEquals(true, html instanceof qx.html.Element);
      this.assertEquals(3, html.getChildren().length);
      let el2 = html.getChildren()[1];
      this.assertEquals(true, html.getChildren()[0] instanceof qx.html.Text);
      this.assertEquals(true, el2 instanceof qx.html.Element);
      this.assertEquals(true, html.getChildren()[2] instanceof qx.html.Text);
      this.assertEquals("el1", html.getAttribute("id"));
      this.assertEquals("el2", el2.getAttribute("id"));
      this.assertEquals("1px solid", el2.getStyle("border"));
    },

    testRefs() {
      let myRef = new qx.html.JsxRef();
      let html = (
        <div>
          <div ref={myRef}></div>
        </div>
      );
      this.assertTrue(html.getChildren()[0] === myRef.getValue());
    }
  }
});
