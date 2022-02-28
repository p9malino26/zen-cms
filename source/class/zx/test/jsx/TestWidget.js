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


qx.Class.define("zx.test.jsx.TestWidget", {
  extend: qx.html.Element,

  construct() {
    this.base(arguments);
    this.add(this.getQxObject("header"));
    this.add(this.getQxObject("body"));
  },

  members: {
    _createQxObjectImpl(id) {
      switch (id) {
        case "header":
          var elem = new qx.html.Element();
          elem.addClass("header-class");
          return elem;

        case "body":
          var elem = new qx.html.Element();
          elem.addClass("body-class");
          elem.add(this.getQxObject("labelOne"));
          elem.add(this.getQxObject("labelTwo"));
          return elem;

        case "labelOne":
          var elem = new qx.html.Element();
          elem.add(new qx.html.Text("Label One"));
          return elem;

        case "labelTwo":
          var elem = new qx.html.Element();
          elem.add(new qx.html.Text("Label Two"));
          return elem;
      }
    }
  }
});
