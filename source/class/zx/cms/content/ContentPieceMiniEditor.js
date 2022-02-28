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

qx.Class.define("zx.cms.content.ContentPieceMiniEditor", {
  extend: zx.cms.content.PieceMiniEditor,

  members: {
    /**
     * @Override
     */
    _remoteControlProperties: ["cssClass"],

    _createQxObjectImpl(id) {
      switch (id) {
        case "root":
          var comp = this.base(arguments, id);
          this._addField(comp, "edtCssClass", "CSS Class(es)", "cssClass");
          return comp;

        case "edtCssClass":
          return new qx.ui.form.TextField().set({ liveUpdate: true });
      }

      return this.base(arguments, id);
    }
  }
});
