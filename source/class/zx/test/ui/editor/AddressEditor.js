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

qx.Class.define("zx.test.ui.editor.AddressEditor", {
  extend: zx.ui.editor.FormEditor,
  include: [qx.ui.core.MChildrenHandling, qx.ui.core.MLayoutHandling],

  construct() {
    this.base(arguments);
    this._addField(this, "edtLine1", "Line 1", "line1");
    this._addField(this, "edtLine2", "Line 2", "line2");
    this._addField(this, "edtCity", "City", "city");
    this._addField(this, "edtPostcode", "Postcode", "postcode");
  },

  members: {
    _masterValueEditor: false,

    _createQxObjectImpl(id) {
      switch (id) {
        case "edtLine1":
        case "edtLine2":
        case "edtCity":
        case "edtPostcode":
          return new qx.ui.form.TextField();
      }

      return this.base(arguments, id);
    }
  }
});
