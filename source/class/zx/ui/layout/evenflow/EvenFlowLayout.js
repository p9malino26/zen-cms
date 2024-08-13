/**
 * A layout where the widgets are arranged in lines (i.e. rows)
 * Widgets start from top left and flow to the right and are wrapped (i.e a new line is started if the next widget in the line doesn't fit).
 * If a line has some space on the right of its widgets, the widgets are spaced out evenly.

 * N.B: Currenly, this class only works when all the child widgets have the same width!
 */
qx.Class.define("zx.ui.layout.evenflow.EvenFlowLayout", {
  extend: qx.ui.layout.Abstract,

  properties: {
    /**
     * The vertical spacing between the lines (i.e. rows) of widgets
     */
    spacingY: {
      check: "Integer",
      init: 0,
      event: "changeSpacingY"
    },

    /**
     * Minimum horizontal spacing between widgets in a line
     */
    spacingX: {
      check: "Integer",
      init: 0,
      event: "changeSpacingX"
    },

    /**
     * Vertical alignment of the widgets in a line
     */
    alignY: {
      check: ["top", "middle", "bottom"],
      init: 0,
      event: "changeAlignY"
    }
  },
  members: {
    /**
     * @override
     */
    renderLayout(availWidth, availHeight, padding) {
      let lineRenderer = new zx.ui.layout.evenflow.LinesRenderer({ layoutMgr: this, availWidth });
      while (lineRenderer.hasMoreLines()) {
        lineRenderer.renderLine();
      }
    },

    /**
     * @override
     */
    _computeSizeHint() {
      return this.__computeSize(Infinity);
    },

    /**
     * @override
     */
    hasHeightForWidth() {
      return true;
    },

    /**
     * @override
     */
    getHeightForWidth(width) {
      return this.__computeSize(width).height;
    },

    /**
     * @override
     */
    connectToWidget(widget) {
      super.connectToWidget(widget);

      // Necessary to be able to calculate the lines for the flow layout.
      // Otherwise the layout calculates the needed width and height by using
      // only one line of items which is leading to the wrong height. This
      // wrong height does e.g. suppress scrolling since the scroll pane does
      // not know about the correct needed height.
      if (widget) {
        widget.setAllowShrinkY(false);
      }
    },

    /**
     * Calculates the width and height of the parent widget based on the its available width,
     * such that all the widgets in all the lines are displayed
     * @param {number} availWidth
     * @returns {{width: number, height: number}}
     */
    __computeSize(availWidth) {
      let lineRenderer = new zx.ui.layout.evenflow.LinesRenderer({ layoutMgr: this, availWidth, dryRun: true });
      let totalLineHeights = 0;
      let hintWidth = 0;

      while (lineRenderer.hasMoreLines()) {
        let line = lineRenderer.renderLine();
        totalLineHeights += line.height;
        hintWidth = Math.max(hintWidth, line.minWidth);
      }
      return {
        width: hintWidth,
        height: totalLineHeights + (lineRenderer.getLineCount() - 1) * this.getSpacingY()
      };
    }
  }
});
