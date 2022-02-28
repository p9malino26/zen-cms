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


qx.Class.define("zx.test.thin.DemoDialog", {
  extend: zx.thin.ui.container.Dialog,
  "@": new zx.cms.content.anno.Feature(),

  construct() {
    this.base(arguments);
    this.set({
      caption: "Hello World Dialog",
      bodyText: "This is the body text"
    });
    this.addButton("Button One");
    let btn = this.addButton("Close Dialog");
    btn.addListener("execute", () => {
      this.hide();
    });
  },

  members: {}
});
