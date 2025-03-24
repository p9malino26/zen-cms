/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2025 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */

/**
 * This class is responsible for calculating the positions of the widgets for a parent with zx.ui.layout.evenflow.EvenFlowLayout,
 * The widgets start from top left and flow to the right and are wrapped (i.e a new line is started if the next widget in the line doesn't fit).

 * @typedef ContextData
 * @property {boolean} dryRun Whether to actually make any side effects (i.e. call renderLayout on the children)
 * @property {number} availWidth Maximum available width for a line, dependent on the parent widget
 * @property {zx.ui.layout.evenflow.EvenFlowLayout} layoutMgr Layout manager of the widget we are rendering the children for
 */
qx.Class.define("zx.ui.layout.evenflow.LinesRenderer", {
  extend: qx.core.Object,
  /**
   * @param {ContextData} context Context data related to the how we need to render the children
   */
  construct(context) {
    super();
    this.__context = context;
    context.dryRun ??= false;

    let children = new qx.data.Array(context.layoutMgr._getLayoutChildren());
    this.__childrenToRender = children.copy().toArray();
  },
  members: {
    /**
     * @type {ContextData}
     * Context data related to the how we need to render the children
     */
    __context: null,

    /**
     * How many lines we have rendered so far
     */
    __lineCount: 0,

    /**
     * The Y position of the line we are currently rendering or about to render, from the top of the parent widget
     */
    __lineYStart: 0,

    /**
     * @type {qx.ui.core.Widget[]}
     * Queue of children that are yet to be positioned and rendered
     */
    __childrenToRender: null,

    /**
     * @type {{minWidth: number, height: number, childMetas: Object[]}}
     * Information relating the line that was previous rendered
     */
    __previousLine: null,

    /**
     *
     * @returns {boolean} Whether there are still more lines to render
     */
    hasMoreLines() {
      return this.__childrenToRender.length > 0;
    },

    /**
     * Determines positions of the widgets for the line that is being rendered
     * This puts as many widgets as possible on the line that can fit, and then spaces them out evenly
     * If this.__context.dryRun is false, it make changes to the actual UI by calling renderLayout on each of the children
     */
    renderLine() {
      let lineWidgetsRenderer = new zx.ui.layout.evenflow.LineWidgetsRenderer({
        ...this.__context,
        previousLine: this.__previousLine,
        lineYStart: this.__lineYStart,
        childrenToRender: this.__childrenToRender
      });
      let lineInfo = lineWidgetsRenderer.renderLineWidgets();
      this.__previousLine = lineInfo;

      //Update state variables
      this.__lineYStart += lineInfo.height + this.__context.layoutMgr.getSpacingY();
      this.__lineCount++;

      return {
        height: lineInfo.height,
        minWidth: lineInfo.minWidth
      };
    },

    /**
     *
     * @returns {number} How many lines have been rendered
     */
    getLineCount() {
      return this.__lineCount;
    }
  }
});
