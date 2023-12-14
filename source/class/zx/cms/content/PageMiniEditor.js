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

qx.Class.define("zx.cms.content.PageMiniEditor", {
  extend: zx.cms.content.AbstractMiniEditor,

  construct() {
    super();
    this._setLayout(new qx.ui.layout.Grow());
    this._add(this.getQxObject("root"));
  },

  members: {
    /**
     * @Override
     */
    _remoteControlProperties: ["cssClass"],

    _createQxObjectImpl(id) {
      switch (id) {
        case "root":
          var comp = new qx.ui.container.Composite();
          this._addField(comp, "edtTitle", "Page Title", "title");
          this._addField(comp, "edtUrl", "URL", "url");
          this._addField(comp, "edtLayout", "Layout", "layout");
          this._addField(comp, "edtCssClass", "CSS Class(es)", "cssClass");
          return comp;

        case "edtTitle":
        case "edtUrl":
        case "edtLayout":
        case "edtCssClass":
          return new qx.ui.form.TextField().set({ liveUpdate: true });
      }

      return super._createQxObjectImpl(id);
    }
  }
});
