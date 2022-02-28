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

qx.Class.define("zx.test.ui.editor.PersonEditor", {
  extend: zx.ui.editor.FormEditor,

  construct() {
    this.base(arguments);
    this._setLayout(new qx.ui.layout.VBox());
    this._add(this.getQxObject("grpName"));
    this._add(this.getQxObject("grpAddress"));
  },

  properties: {
    showFieldInvalid: {
      init: "message",
      refine: true
    }
  },

  members: {
    _masterValueEditor: true,

    _saveValueImpl() {
      this.base(arguments);
      this.info("Saving person");
    },

    _createQxObjectImpl(id) {
      switch (id) {
        case "grpName":
          var grp = new qx.ui.groupbox.GroupBox("Name");
          this._addField(grp, "edtName", "Name", "name");
          this._addField(grp, "edtAge", "Age", "age", {
            dataType: "Integer"
          });
          return grp;

        case "edtName":
          return new qx.ui.form.TextField().set({ required: true });

        case "edtAge":
          return new qx.ui.form.TextField().set({
            required: true,
            validator: value => {
              value = parseInt(value, 10);
              return isNaN(value) || value < 18
                ? "Please enter an age, 18 years or over"
                : null;
            }
          });

        case "grpAddress":
          var grp = new qx.ui.groupbox.GroupBox("Address");
          grp.setLayout(new qx.ui.layout.Grow());
          this._addField(grp, "edAddress", null, "address");
          return grp;

        case "edAddress":
          var ed = new zx.test.ui.editor.AddressEditor();
          ed.addListener("changeModified", evt => {
            this.info("Address editor detected modified=" + evt.getData());
          });
          return ed;
      }

      return this.base(arguments, id);
    }
  }
});
