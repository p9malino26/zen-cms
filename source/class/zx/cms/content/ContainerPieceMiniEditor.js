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

qx.Class.define("zx.cms.content.ContainerPieceMiniEditor", {
  extend: zx.cms.content.PieceMiniEditor,

  members: {
    /**
     * @Override
     */
    _remoteControlProperties: ["cssClass", "orientation"],

    _createQxObjectImpl(id) {
      switch (id) {
        case "root":
          var comp = this.base(arguments, id);
          this._addField(comp, "cboOrientation", "Orientation", "orientation");
          this._addField(comp, "edtCssClass", "CSS Class(es)", "cssClass");
          return comp;

        case "cboOrientation":
          var cbo = new qx.ui.form.SelectBox();
          cbo.add(new qx.ui.form.ListItem("Please select...", null, null));
          cbo.add(
            new qx.ui.form.ListItem(
              "Horizontal",
              "@FontAwesomeSolid/grip-horizontal/16",
              "horizontal"
            )
          );
          cbo.add(
            new qx.ui.form.ListItem(
              "Vertical",
              "@FontAwesomeSolid/grip-vertical/16",
              "vertical"
            )
          );
          cbo.add(
            new qx.ui.form.ListItem(
              "Flow",
              "@FontAwesomeSolid/stream/16",
              "flow"
            )
          );
          return cbo;

        case "edtCssClass":
          return new qx.ui.form.TextField().set({ liveUpdate: true });
      }

      return this.base(arguments, id);
    }
  }
});
