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

qx.Class.define("zx.ui.tree.TreeLayout", {
  extend: qx.ui.layout.Abstract,

  construct: function () {
    this.base(arguments);
  },

  members: {
    /*
     * @Override
     */
    _computeSizeHint: function () {
      var tree = this._getWidget(),
        rows = tree.getRows(),
        hint = {
          width: tree.getWidth(),
          height: 0,
          minHeight: 0
        };

      for (var i = 0; i < rows.length; i++) {
        var row = rows[i],
          rowHint = row.getSizeHint(),
          height = rowHint.height;
        hint.height += height;
        if (rowHint.minHeight) hint.minHeight += rowHint.minHeight;
        if (hint.width === null || hint.width < rowHint.width)
          hint.width = rowHint.width;
      }

      return hint;
    },

    /*
     * @Override
     */
    renderLayout: function (availWidth, availHeight) {
      var tree = this._getWidget(),
        rows = tree.getRows(),
        top = 0;

      for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        var row = rows[rowIndex],
          rowHint = row.getSizeHint();
        row.renderLayout(0, top, availWidth, rowHint.height);
        top += rowHint.height;
      }
    }
  }
});
