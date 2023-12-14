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

qx.Class.define("zx.ui.tree.column.BooleanColumn", {
  extend: zx.ui.tree.column.Column,

  members: {
    getDisplayValue(model) {
      var value = super.getDisplayValue(model);
      return value ? "Yes" : "No";
    },

    _createEditWidget() {
      var widget = new qx.ui.form.CheckBox();
      widget.addListener("blur", evt => {
        this.fireEvent("editorFinished");
      });

      widget.addListener("keypress", evt => {
        if (evt.getKeyIdentifier() == "Enter" || evt.getKeyIdentifier() == "Escape") {
          this.fireEvent("editorFinished");
        }
        if (evt.getKeyIdentifier() == "Tab") {
          this.fireEvent("editorNext");
        }
      });

      return widget;
    },

    _setEditWidgetValue(model) {
      this.getEditWidget().setValue(this.getRawValue(model));
    },

    compare(left, right) {
      left = this.getRawValue(left);
      right = this.getRawValue(right);
      if (left instanceof Date) {
        left = left.getTime();
      }
      if (right instanceof Date) {
        right = right.getTime();
      }

      return left < right ? -1 : left > right ? 1 : 0;
    }
  }
});
