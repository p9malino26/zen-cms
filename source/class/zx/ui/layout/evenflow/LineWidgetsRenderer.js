/**
 * This class is responsible for rendering the widgets in one line for a parent widget using zx.ui.layout.evenflow.EvenFlowLayout
 * It determines the positions of the widgets in the line,
 * and can call the renderLayout method on them
 *
 * @typedef ContextData
 * @property {number} lineYStart The Y position of the line we are currently rendering or about to render, from the top of the parent widget
 * @property {boolean} dryRun Whether to actually make any side effects (i.e. call renderLayout on the children)
 * @property {number} availWidth Maximum available width of the line, dependent on the parent widget
 * @property {zx.ui.layout.evenflow.EvenFlowLayout} layoutMgr Layout manager of the widget we are rendering the children for
 * @property {qx.ui.core.Widget[]} childrenToRender Queue of children that are left to be positioned and rendered
 * @property {{minWidth: number, height: number, childMetas: ChildMeta[]}?} previousLine The line that was previously rendered, if there was
 *
 * @typedef ChildMeta
 * @property {qx.ui.core.Widget} widget The widget that was added to the line
 * @property {number} initialLeft The left position of the widget when it was added to the line in the first pass
 * @property {number} finalWidth The final calculated width of the widget after the second pass
 * @property {number} finalCentre The final horizontal position of centre of the widget in the line, after the second pass
 */
qx.Class.define("zx.ui.layout.evenflow.LineWidgetsRenderer", {
  extend: qx.core.Object,
  /**
   * @param {ContextData} context Context data related to the line we are rendering the widgets for
   */
  construct(context) {
    super();
    this.__context = context;
    this.__childMetas = [];
  },
  members: {
    /**
     * @type {ContextData}
     */
    __context: null,

    /**
     * @type {ChildMeta[]}
     * Metadata for the children widgets that are being rendered in this line
     */
    __childMetas: null,

    /**
     * The height of the line that is being rendered.
     * It is the maximum of the heights of all the widgets, respecting margins and spacing
     */
    __lineHeight: 0,

    /**
     * The minimum width of the line that is being rendered.
     * It is the total width of the widgets on the line put as close together as possible (respecting margins & spacing),
     * and not when they are spaced out evenly across the line
     */
    __lineMinWidth: 0,

    /**
     *
     * Determines the final sizes and positions of the children widgets in the line
     * and calls the renderLayout method of each child widget if this.__context.dryRun is false
     *
     * This is done in a 2-pass process
     * The first pass puts as many widgets as possible on one line
     * The second pass spaces out the widgets evenly across the line
     *
     * @return {{height: number, minWidth: number, childMetas: ChildMeta[]}} The height and minimum width and children information of the line that was rendered
     * minWidth is the total width of the widgets put as close together as possible, respecting their margins & spacing
     */
    renderLineWidgets() {
      this.__childMetas = [];
      this.__pass1();
      this.__pass2();
      return { height: this.__lineHeight, minWidth: this.__lineMinWidth, childMetas: this.__childMetas };
    },

    /**
     * First pass of putting the widgets into a line.
     * We fit as many widgets as possible into a line (assuming their widths are their hint widths),
     * and we respect their margins & spacing.
     */
    __pass1() {
      let children = this.__context.childrenToRender;
      let childMetas = this.__childMetas;
      let previousChild = null;
      while (true) {
        //see if we have a child widget to render
        let child = children[0];
        if (!child) {
          break;
        }

        //check if this widget will fit on this line
        //if it doesn't, we have finished rendering the line
        let hint = child.getSizeHint();
        let gap = this.__getGapBeforeChild(child, previousChild);
        let childAndMarginWidth = gap + hint.width;

        if (this.__lineMinWidth + childAndMarginWidth > this.__context.availWidth && previousChild) {
          break;
        }

        //store some metadata for the widget we are currenly adding to the line
        //N.B: currently, the final rendered width of the widget will be its hint.width,
        //but we store it in the metadata just in case we will have dynamic widget sizes in the future
        let childMeta = {};
        childMeta.widget = child;
        childMeta.initialLeft = this.__lineMinWidth + gap;
        childMeta.finalWidth = hint.width;
        childMetas.push(childMeta);

        //Update lineHeight
        let childHeightWithMargins = hint.height + child.getMarginTop() + child.getMarginBottom();
        this.__lineHeight = Math.max(this.__lineHeight, childHeightWithMargins);

        //Update state variables
        this.__lineMinWidth += childAndMarginWidth;
        previousChild = child;
        children.shift();
      }
    },

    /**
     * Second pass of the line rendering.
     * We space out the widgets evenly across the line,
     * and call the renderLayout method of each child widget if this.__context.dryRun is false
     */
    __pass2() {
      //shorthands
      let childMetas = this.__childMetas;
      let childrenToRender = this.__context.childrenToRender;
      let layout = this.__context.layoutMgr;
      let isLastLine = childrenToRender.length == 0;
      let isFirstLine = !this.__context.previousLine;

      //find out by how much we need to move the widgets so they are spaced out evenly
      let scaleFactor = this.__context.availWidth / this.__lineMinWidth;

      for (let [childMetaIndex, childMeta] of childMetas.entries()) {
        //shorthands
        let child = childMeta.widget;
        let hint = child.getSizeHint();

        /*we move each widget in this line such that
        We find the horizontal distance from the beginning of the line to the center of the widget,
        multiply it by the scale factor,
        and this will be the new horizontal distance from the beginning of the line to the center of the widget 

        However, this is a little different for the last line if we have multiple lines,
        where they may be a lot of space after the widgets on the right.
        In which case, we align the centers of the widgets in the last line with the centers of the widgets in the previous line.
        This makes the widgets in the bottom line aligned with the columns of the widgets above them
        */
        let finalCentre;
        if (isLastLine && !isFirstLine) {
          finalCentre = this.__context.previousLine.childMetas[childMetaIndex].finalCentre;
        } else {
          let initialCentre = childMeta.initialLeft + childMeta.finalWidth / 2;
          finalCentre = initialCentre * scaleFactor;
        }
        childMeta.finalCentre = finalCentre;
        let finalLeft = Math.floor(finalCentre - childMeta.finalWidth / 2);

        let childYOffset = qx.ui.layout.Util.computeVerticalAlignOffset(
          layout.getAlignY() ?? childMeta.widget.getAlignY(),
          hint.height,
          this.__lineHeight,
          child.getMarginTop(),
          child.getMarginBottom()
        );

        if (!this.__context.dryRun) {
          child.renderLayout(finalLeft, this.__context.lineYStart + childYOffset, childMeta.finalWidth, hint.height);
        }
      }
    },

    /**
     * Computes the gap before the child at the given index
     * @param {qx.ui.core.Widget} child The child widget to find the gap before
     * @param {qx.ui.core.Widget?} previousChild The child widget before the child, if there is one
     */
    __getGapBeforeChild(child, previousChild) {
      let spacingX = this.__context.layoutMgr.getSpacingX();

      if (!previousChild) {
        return child.getMarginLeft();
      } else {
        return Math.max(previousChild.getMarginRight(), child.getMarginLeft(), spacingX);
      }
    }
  }
});
