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

qx.Class.define("zx.cms.content.PieceMiniEditor", {
  extend: zx.cms.content.AbstractMiniEditor,

  construct() {
    this.base(arguments);
    this._setLayout(new qx.ui.layout.Grow());
    this._add(this.getQxObject("root"));
  },

  members: {
    _createQxObjectImpl(id) {
      switch (id) {
        case "root":
          var comp = new qx.ui.container.Composite();
          this._addField(comp, "edtPieceTitle", "Title", "pieceTitle");
          return comp;

        case "edtPieceTitle":
          return new qx.ui.form.TextField().set({ liveUpdate: true });
      }

      return this.base(arguments, id);
    }
  }
});
