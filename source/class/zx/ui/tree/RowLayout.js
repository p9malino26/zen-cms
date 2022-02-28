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

qx.Class.define("zx.ui.tree.RowLayout", {
  extend: qx.ui.layout.Abstract,

  members: {
    /*
     * @Override
     */
    renderLayout: function (availWidth, availHeight, padding) {
      var row = this._getWidget();
      var ctlr = row.getController();

      var indent = row.getIndentWidth() * row.getIndent();

      var arrow = row.getChildControl("arrow");
      var hint = arrow.getSizeHint();
      if (row.isHasChildren()) {
        var top = !hint.height ? 0 : parseInt((availHeight - hint.height) / 2);
        var height = Math.min(
          hint.maxHeight,
          Math.max(availHeight, hint.minHeight)
        );
        arrow.renderLayout(indent, top, hint.width, height);
      }
      var firstColumnLoss = indent + hint.width;

      var check = row.getChildControl("check");
      var hint = check.getSizeHint();
      var top = !hint.height ? 0 : parseInt((availHeight - hint.height) / 2);
      var height = Math.min(
        hint.maxHeight,
        Math.max(availHeight, hint.minHeight)
      );
      check.renderLayout(firstColumnLoss, top, hint.width, height);
      firstColumnLoss += hint.width;

      if (!ctlr) return;

      var widths = [];
      var numFill = 0;
      var usedSpace = 0;

      function cap(column, width) {
        if (column.getMaxWidth() !== null)
          width = Math.min(column.getMaxWidth(), width);
        if (column.getMinWidth() !== null)
          width = Math.max(column.getMinWidth(), width);
        return width;
      }

      for (
        var i = 0, columns = ctlr.getColumnsForRow(row);
        i < columns.getLength();
        i++
      ) {
        var column = columns.getItem(i);
        var child = row.getColumnWidget(i);
        var hint = child.getSizeHint();

        var top = !hint.height ? 0 : parseInt((availHeight - hint.height) / 2);
        var width = column.getWidth();
        if (typeof width == "string") {
          if (width == "*") width = null;
          else {
            if (width.match(/%$/)) {
              var pct = parseInt(width, 10) / 100;
              width = parseInt(availWidth * pct, 10);
            } else {
              width = parseInt(width, 10);
            }
          }
        }
        if (width === null) numFill++;
        else {
          width = cap(column, width);
          usedSpace += width;
        }
        widths[i] = width;
      }
      var fillSize = Math.floor((availWidth - usedSpace) / numFill);
      for (var i = 0; i < widths.length; i++) {
        if (widths[i] === null) {
          widths[i] = cap(columns.getItem(i), fillSize);
        }
      }
      if (widths.length) {
        widths[0] = Math.max(widths[0] - firstColumnLoss, 0);
      }

      var left = firstColumnLoss;
      for (
        var i = 0, columns = ctlr.getColumnsForRow(row);
        i < columns.getLength();
        i++
      ) {
        var column = columns.getItem(i);
        var child = row.getColumnWidget(i);
        var hint = child.getSizeHint();

        if (i) left++;
        var top = !hint.height
          ? 0
          : Math.round((availHeight - hint.height) / 2);
        var hint = child.getSizeHint();
        var height = Math.min(
          hint.maxHeight,
          Math.max(availHeight, hint.minHeight)
        );
        child.renderLayout(left, top, widths[i], height);

        left += widths[i];
      }
    },

    /*
     * @Override
     */
    _computeSizeHint: function () {
      var row = this._getWidget();
      var ctlr = row.getController();

      var result = {
        width: 0,
        height: 0,
        minWidth: 0,
        minHeight: 0
      };

      var indent = row.getIndentWidth() * row.getIndent();
      var arrow = row.getChildControl("arrow");
      var hint = arrow.getSizeHint();
      result.width = indent + hint.width;
      result.height = Math.max(result.height, hint.height);
      if (hint.minHeight)
        result.minHeight = Math.max(result.minHeight, hint.minHeight);

      if (ctlr) {
        for (
          var i = 0, columns = ctlr.getColumnsForRow(row);
          i < columns.getLength();
          i++
        ) {
          var column = columns.getItem(i);
          var child = row.getColumnWidget(i);
          var hint = child.getSizeHint();

          if (i) result.width++;

          var width = column.getWidth();
          if (typeof width != "number") width = 20;
          result.width += width;

          result.height = Math.max(result.height, hint.height);
          if (hint.minHeight)
            result.minHeight = Math.max(result.minHeight, hint.minHeight);
        }
      }
      //result.maxWidth = result.width;

      return result;
    }
  }
});
